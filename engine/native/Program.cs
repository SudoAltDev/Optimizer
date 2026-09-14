using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace MemoryEngine
{
    class Program
    {
        [DllImport("ntdll.dll")]
        private static extern int NtSetSystemInformation(int SystemInformationClass, ref int SystemInformation, int SystemInformationLength);

        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool OpenProcessToken(IntPtr ProcessHandle, uint DesiredAccess, out IntPtr TokenHandle);

        [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern bool LookupPrivilegeValue(string? lpSystemName, string lpName, out long lpLuid);

        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool AdjustTokenPrivileges(IntPtr TokenHandle, bool DisableAllPrivileges, ref TOKEN_PRIVILEGES NewState, int BufferLength, IntPtr PreviousState, IntPtr ReturnLength);

        [DllImport("psapi.dll")]
        private static extern int EmptyWorkingSet(IntPtr hwProc);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool GlobalMemoryStatusEx(ref MEMORYSTATUSEX lpBuffer);

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        private struct TOKEN_PRIVILEGES
        {
            public int PrivilegeCount;
            public long Luid;
            public int Attributes;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct MEMORYSTATUSEX
        {
            public uint dwLength;
            public uint dwMemoryLoad;
            public ulong ullTotalPhys;
            public ulong ullAvailPhys;
            public ulong ullTotalPageFile;
            public ulong ullAvailPageFile;
            public ulong ullTotalVirtual;
            public ulong ullAvailVirtual;
            public ulong ullAvailExtendedVirtual;
        }

        public class ProcessInfo
        {
            public int pid { get; set; }
            public string name { get; set; } = "";
            public double ramMB { get; set; }
            public double cpuSec { get; set; }
            public string priority { get; set; } = "Normal";
            public int threads { get; set; } = 1;
            public string path { get; set; } = "";
        }

        private const int SE_PRIVILEGE_ENABLED = 0x00000002;
        private const uint TOKEN_ADJUST_PRIVILEGES = 0x0020;
        private const uint TOKEN_QUERY = 0x0008;
        private const int SYSTEM_MEMORY_LIST_INFORMATION = 80;

        private const int MemoryPurgeStandbyList = 1;
        private const int MemoryEmptyWorkingSets = 2;

        static bool SetPrivilege(string privilege)
        {
            try
            {
                if (!OpenProcessToken(Process.GetCurrentProcess().Handle, TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, out IntPtr hToken))
                    return false;

                if (!LookupPrivilegeValue(null, privilege, out long luid))
                    return false;

                TOKEN_PRIVILEGES tp = new TOKEN_PRIVILEGES
                {
                    PrivilegeCount = 1,
                    Luid = luid,
                    Attributes = SE_PRIVILEGE_ENABLED
                };

                return AdjustTokenPrivileges(hToken, false, ref tp, 0, IntPtr.Zero, IntPtr.Zero);
            }
            catch
            {
                return false;
            }
        }

        static MEMORYSTATUSEX GetMemoryStatus()
        {
            MEMORYSTATUSEX memStatus = new MEMORYSTATUSEX();
            memStatus.dwLength = (uint)Marshal.SizeOf(typeof(MEMORYSTATUSEX));
            GlobalMemoryStatusEx(ref memStatus);
            return memStatus;
        }

        static int TrimAllWorkingSets()
        {
            int count = 0;
            Process[] processes = Process.GetProcesses();
            foreach (Process proc in processes)
            {
                try
                {
                    // Skip current process and idle/system
                    if (proc.Id == 0 || proc.Id == 4 || proc.Id == Process.GetCurrentProcess().Id)
                        continue;

                    if (EmptyWorkingSet(proc.Handle) != 0)
                    {
                        count++;
                    }
                }
                catch
                {
                    // Ignore access denied for protected system processes
                }
                finally
                {
                    proc.Dispose();
                }
            }
            return count;
        }

        static void Main(string[] args)
        {
            string mode = args.Length > 0 ? args[0].ToLower() : "--all";

            MEMORYSTATUSEX memBefore = GetMemoryStatus();
            bool hasProfilePriv = SetPrivilege("SeProfileSingleProcessPrivilege");
            bool hasQuotaPriv = SetPrivilege("SeIncreaseQuotaPrivilege");

            bool standbyPurged = false;
            int workingSetsTrimmed = 0;
            string message = "";

            if (mode == "--status")
            {
                var statusObj = new
                {
                    totalPhysBytes = memBefore.ullTotalPhys,
                    availPhysBytes = memBefore.ullAvailPhys,
                    usedPhysBytes = memBefore.ullTotalPhys - memBefore.ullAvailPhys,
                    memoryLoadPercent = memBefore.dwMemoryLoad,
                    totalPageFileBytes = memBefore.ullTotalPageFile,
                    availPageFileBytes = memBefore.ullAvailPageFile
                };
                Console.WriteLine(JsonSerializer.Serialize(statusObj));
                return;
            }

            if (mode == "--processes")
            {
                var procList = new System.Collections.Generic.List<ProcessInfo>();
                Process[] processes = Process.GetProcesses();
                foreach (var p in processes)
                {
                    try
                    {
                        if (p.Id <= 4) continue;

                        long wsBytes = 0;
                        try { wsBytes = p.WorkingSet64; } catch { }

                        string priority = "Normal";
                        try { priority = p.PriorityClass.ToString(); } catch { }

                        double cpuSec = 0;
                        try { cpuSec = Math.Round(p.TotalProcessorTime.TotalSeconds, 1); } catch { }

                        string path = "";
                        try { path = p.MainModule?.FileName ?? ""; } catch { }

                        int threads = 1;
                        try { threads = p.Threads.Count; } catch { }

                        procList.Add(new ProcessInfo
                        {
                            pid = p.Id,
                            name = p.ProcessName,
                            ramMB = Math.Round(wsBytes / (1024.0 * 1024.0), 1),
                            cpuSec = cpuSec,
                            priority = priority,
                            threads = threads,
                            path = path
                        });
                    }
                    catch { }
                    finally { p.Dispose(); }
                }

                procList.Sort((a, b) => b.ramMB.CompareTo(a.ramMB));
                Console.WriteLine(JsonSerializer.Serialize(procList));
                return;
            }

            if (mode == "--purge-standby" || mode == "--all")
            {
                int cmd = MemoryPurgeStandbyList;
                int ntResult = NtSetSystemInformation(SYSTEM_MEMORY_LIST_INFORMATION, ref cmd, sizeof(int));
                standbyPurged = (ntResult == 0);
                if (!standbyPurged)
                {
                    message += $"Standby purge returned NTSTATUS 0x{ntResult:X8} (Elevated admin required for global standby list). ";
                }
                else
                {
                    message += "Standby memory cache purged successfully. ";
                }
            }

            if (mode == "--empty-workingsets" || mode == "--all")
            {
                // Try NT system-wide empty working sets first
                int cmdWs = MemoryEmptyWorkingSets;
                int ntWsResult = NtSetSystemInformation(SYSTEM_MEMORY_LIST_INFORMATION, ref cmdWs, sizeof(int));

                // Also run per-process EmptyWorkingSet for all user processes
                workingSetsTrimmed = TrimAllWorkingSets();
                message += $"Working sets trimmed across {workingSetsTrimmed} processes. ";
            }

            // Short sleep to allow memory manager to update
            System.Threading.Thread.Sleep(150);
            MEMORYSTATUSEX memAfter = GetMemoryStatus();

            long freed = (long)memAfter.ullAvailPhys - (long)memBefore.ullAvailPhys;
            if (freed < 0) freed = 0;

            var result = new
            {
                success = true,
                mode = mode,
                standbyPurged = standbyPurged,
                workingSetsTrimmed = workingSetsTrimmed,
                ramBefore = new
                {
                    totalBytes = memBefore.ullTotalPhys,
                    availBytes = memBefore.ullAvailPhys,
                    usedBytes = memBefore.ullTotalPhys - memBefore.ullAvailPhys,
                    loadPercent = memBefore.dwMemoryLoad
                },
                ramAfter = new
                {
                    totalBytes = memAfter.ullTotalPhys,
                    availBytes = memAfter.ullAvailPhys,
                    usedBytes = memAfter.ullTotalPhys - memAfter.ullAvailPhys,
                    loadPercent = memAfter.dwMemoryLoad
                },
                freedBytes = freed,
                message = message.Trim()
            };

            Console.WriteLine(JsonSerializer.Serialize(result));
        }
    }
}
