/**
 * Authentic Splunk Enterprise 9.2.1 Web Interface
 * Provides the official Splunk Enterprise Login Portal and Full-Featured Console
 * for parallel instance access in new browser tabs and embedded frames.
 */

export function getSplunkWebHtml(params: {
  port?: number | string;
  serverName?: string;
  version?: string;
}): string {
  const port = params.port || 8001;
  const serverName = params.serverName || 'splunk-parallel-staging-01';
  const version = params.version || '9.2.1';

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Splunk Enterprise (${serverName}:${port})</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ea0089'><text x='2' y='18' font-family='sans-serif' font-weight='900' font-size='20'>&gt;</text></svg>">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            splunk: {
              black: '#11161f',
              dark: '#1c2430',
              card: '#222c3a',
              pink: '#ea0089',
              pinkHover: '#d00079',
              green: '#65a30d',
              orange: '#f97316',
              border: '#2e3d50',
              input: '#0d1219'
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700;800;900&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #11161f;
      color: #e2e8f0;
      user-select: text;
    }
    .font-mono {
      font-family: 'Roboto Mono', monospace;
    }
    .splunk-logo-font {
      font-weight: 900;
      letter-spacing: -0.04em;
    }
    .splunk-login-bg {
      background: radial-gradient(circle at 50% 30%, #1c2738 0%, #11161f 70%, #0a0d13 100%);
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased selection:bg-[#ea0089] selection:text-white">

  <!-- ========================================================================= -->
  <!-- 1. AUTHENTIC SPLUNK ENTERPRISE LOGIN VIEW (/en-US/account/login)           -->
  <!-- ========================================================================= -->
  <div id="splunk-login-view" class="min-h-screen flex flex-col justify-between splunk-login-bg p-6">
    <!-- Top Tiny Bar -->
    <div class="flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center gap-2">
        <span class="text-[#ea0089] font-bold splunk-logo-font text-base">&gt;splunk&gt;</span>
        <span class="text-slate-300 font-bold uppercase tracking-wider text-[11px]">Enterprise</span>
      </div>
      <div class="flex items-center gap-2 font-mono text-[11px] text-slate-400">
        <span>Host: <strong class="text-slate-200">${serverName}</strong></span>
        <span>|</span>
        <span>Port: <strong class="text-emerald-400">${port}</strong></span>
      </div>
    </div>

    <!-- Center Login Box -->
    <div class="max-w-md w-full mx-auto my-auto p-8 rounded-2xl bg-[#18212e] border border-[#2b3a4e] shadow-2xl space-y-6">
      <!-- Splunk Logo Header -->
      <div class="text-center space-y-2">
        <div class="flex items-center justify-center gap-1">
          <span class="text-[#ea0089] text-3xl splunk-logo-font">&gt;splunk&gt;</span>
          <span class="text-white text-lg font-bold tracking-tight">enterprise</span>
        </div>
        <p class="text-xs text-slate-400">Version ${version} (build 9.2.1-e781a9)</p>
      </div>

      <!-- Login Form -->
      <form id="login-form" onsubmit="handleLoginSubmit(event)" class="space-y-4">
        <div id="login-error" class="hidden p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
          Invalid username or password. Please check your credentials.
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-300">Username</label>
          <input 
            type="text" 
            id="login-username" 
            value="admin" 
            required
            class="w-full bg-[#0e141d] border border-[#33445c] focus:border-[#ea0089] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition font-sans"
            placeholder="admin"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-bold text-slate-300">Password</label>
            <span class="text-[11px] text-slate-400">Default: <code class="text-cyan-400">AdminSecure2026!</code></span>
          </div>
          <input 
            type="password" 
            id="login-password" 
            value="AdminSecure2026!" 
            required
            class="w-full bg-[#0e141d] border border-[#33445c] focus:border-[#ea0089] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition font-sans"
            placeholder="••••••••••••"
          />
        </div>

        <button 
          type="submit" 
          id="login-btn"
          class="w-full py-2.5 rounded-xl bg-[#ea0089] hover:bg-[#d00079] text-white font-bold text-sm transition shadow-lg shadow-[#ea0089]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>Sign In</span>
        </button>

        <div class="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
          First time signing in? Splunk username is <strong class="text-slate-200">admin</strong>.
        </div>
      </form>
    </div>

    <!-- Official Login Footer -->
    <div class="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-4 border-t border-slate-800/80">
      <div>
        <span>&copy; 2026 Splunk Inc. All rights reserved.</span>
      </div>
      <div class="flex items-center gap-4 text-slate-400">
        <a href="#" class="hover:underline">Documentation</a>
        <a href="#" class="hover:underline">Privacy Policy</a>
        <a href="#" class="hover:underline">Support</a>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 2. AUTHENTIC SPLUNK ENTERPRISE CONSOLE VIEW (/en-US/app/launcher/home)     -->
  <!-- ========================================================================= -->
  <div id="splunk-console-view" class="hidden min-h-screen flex-col bg-[#11161f] text-slate-200">
    
    <!-- Splunk Top Dark Header Bar -->
    <header class="bg-[#18212e] border-b border-[#28374a] sticky top-0 z-50 text-xs shadow-md">
      <div class="px-4 h-11 flex items-center justify-between gap-4">
        
        <!-- Left: Splunk Logo & Navigation Menus -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 cursor-pointer select-none" onclick="switchAppTab('search')">
            <span class="text-[#ea0089] text-lg splunk-logo-font">&gt;splunk&gt;</span>
            <span class="text-white text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#253245] border border-slate-700">enterprise</span>
          </div>

          <div class="h-4 w-[1px] bg-slate-700 hidden sm:block"></div>

          <!-- Apps Dropdown -->
          <div class="relative">
            <button onclick="toggleDropdown('apps-menu')" class="flex items-center gap-1 text-slate-200 hover:text-white font-semibold px-2 py-1 rounded hover:bg-slate-700/60 transition">
              <span id="active-app-name">Search &amp; Reporting</span>
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div id="apps-menu" class="hidden absolute left-0 top-full mt-1 w-64 bg-[#1b2535] border border-[#2e3e56] rounded-xl shadow-2xl p-2 z-50">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">Apps</div>
              <button onclick="selectApp('Search &amp; Reporting', 'search')" class="w-full text-left px-3 py-1.5 rounded-lg bg-[#ea0089]/20 text-[#ea0089] font-bold text-xs hover:bg-[#ea0089]/30 transition">Search &amp; Reporting</button>
              <button onclick="selectApp('Splunk Enterprise Security', 'es')" class="w-full text-left px-3 py-1.5 rounded-lg text-slate-300 text-xs hover:bg-slate-800 transition">Splunk Enterprise Security</button>
              <button onclick="selectApp('Splunk IT Service Intelligence', 'itsi')" class="w-full text-left px-3 py-1.5 rounded-lg text-slate-300 text-xs hover:bg-slate-800 transition">Splunk IT Service Intelligence</button>
              <button onclick="selectApp('Cluster Status &amp; Architecture', 'cluster')" class="w-full text-left px-3 py-1.5 rounded-lg text-slate-300 text-xs hover:bg-slate-800 transition">Cluster Architecture Monitor</button>
            </div>
          </div>

          <!-- Quick Navigation Links -->
          <div class="hidden md:flex items-center gap-1 text-slate-300 text-xs">
            <button onclick="switchAppTab('search')" class="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition font-medium">Search</button>
            <button onclick="switchAppTab('dashboards')" class="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition font-medium">Dashboards</button>
            <button onclick="switchAppTab('reports')" class="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition font-medium">Reports</button>
            <button onclick="switchAppTab('alerts')" class="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition font-medium">Alerts</button>
          </div>
        </div>

        <!-- Right: Server Badge, Settings, Activity, Help, Admin -->
        <div class="flex items-center gap-2">
          <!-- Server Indicator -->
          <div class="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>${serverName}:${port}</span>
          </div>

          <!-- Settings Dropdown -->
          <div class="relative">
            <button onclick="toggleDropdown('settings-menu')" class="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition">
              <span>Settings</span>
              <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div id="settings-menu" class="hidden absolute right-0 top-full mt-1 w-72 bg-[#1b2535] border border-[#2e3e56] rounded-xl shadow-2xl p-3 z-50 grid grid-cols-2 gap-2 text-xs">
              <div class="space-y-1">
                <div class="text-[10px] font-bold text-slate-400 uppercase">Knowledge</div>
                <a href="#" class="block text-slate-300 hover:text-[#ea0089] py-0.5">Searches &amp; Reports</a>
                <a href="#" class="block text-slate-300 hover:text-[#ea0089] py-0.5">Event Types</a>
                <a href="#" class="block text-slate-300 hover:text-[#ea0089] py-0.5">Tags &amp; Lookups</a>
                <a href="#" class="block text-slate-300 hover:text-[#ea0089] py-0.5">Data Models</a>
              </div>
              <div class="space-y-1">
                <div class="text-[10px] font-bold text-slate-400 uppercase">System</div>
                <a href="#" onclick="switchAppTab('datainputs')" class="block text-slate-300 hover:text-[#ea0089] py-0.5">Data Inputs</a>
                <a href="#" onclick="switchAppTab('indexes')" class="block text-slate-300 hover:text-[#ea0089] py-0.5">Indexes</a>
                <a href="#" class="block text-slate-300 hover:text-[#ea0089] py-0.5">Forwarding &amp; Receiving</a>
                <a href="#" class="block text-slate-300 hover:text-[#ea0089] py-0.5">Server Settings</a>
              </div>
            </div>
          </div>

          <!-- Activity Dropdown -->
          <div class="relative">
            <button onclick="toggleDropdown('activity-menu')" class="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition">
              <span>Activity</span>
              <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div id="activity-menu" class="hidden absolute right-0 top-full mt-1 w-48 bg-[#1b2535] border border-[#2e3e56] rounded-xl shadow-2xl p-2 z-50 text-xs">
              <a href="#" class="block px-2.5 py-1.5 rounded text-slate-300 hover:bg-slate-800">Jobs (Search History)</a>
              <a href="#" class="block px-2.5 py-1.5 rounded text-slate-300 hover:bg-slate-800">Triggered Alerts</a>
              <a href="#" class="block px-2.5 py-1.5 rounded text-slate-300 hover:bg-slate-800">System Activity Monitor</a>
            </div>
          </div>

          <!-- User Menu -->
          <div class="relative">
            <button onclick="toggleDropdown('user-menu')" class="flex items-center gap-1.5 text-slate-200 font-bold px-2.5 py-1 rounded bg-[#253245] border border-slate-700 hover:bg-slate-700 transition">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span id="console-username">admin</span>
              <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div id="user-menu" class="hidden absolute right-0 top-full mt-1 w-44 bg-[#1b2535] border border-[#2e3e56] rounded-xl shadow-2xl p-1.5 z-50 text-xs">
              <div class="px-2.5 py-1 text-slate-400 border-b border-slate-700/60 mb-1 text-[11px]">Signed in as <strong>admin</strong></div>
              <a href="#" class="block px-2.5 py-1 rounded text-slate-300 hover:bg-slate-800">Preferences</a>
              <a href="#" class="block px-2.5 py-1 rounded text-slate-300 hover:bg-slate-800">Account Settings</a>
              <button onclick="handleLogout()" class="w-full text-left px-2.5 py-1 rounded text-rose-400 hover:bg-rose-500/10 font-medium">Logout</button>
            </div>
          </div>
        </div>

      </div>
    </header>

    <!-- Main Dynamic Splunk App Workspace -->
    <main class="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">

      <!-- ================= SEARCH TAB ================= -->
      <div id="tab-search" class="space-y-4">
        
        <!-- Search Input Toolbar -->
        <div class="p-4 rounded-xl bg-[#18212e] border border-[#2b3a4e] shadow-xl space-y-3">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span class="font-bold text-white flex items-center gap-1.5">
              <svg class="w-4 h-4 text-[#ea0089]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <span>New Search</span>
            </span>
            <div class="flex items-center gap-3 font-mono text-[11px]">
              <span class="text-slate-400">Mode: <strong class="text-slate-200">Smart Mode</strong></span>
              <span>•</span>
              <span class="text-emerald-400">Daemon: Online</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <div class="absolute left-3.5 top-2.5 text-[#ea0089] font-mono font-bold text-sm">&gt;</div>
              <input 
                type="text" 
                id="search-input" 
                value="index=_internal sourcetype=splunkd | head 30" 
                class="w-full bg-[#0d131c] border border-[#34455d] focus:border-[#ea0089] rounded-xl pl-8 pr-4 py-2.5 font-mono text-xs text-pink-300 outline-none transition"
                placeholder="Enter SPL query, e.g. index=* | stats count by sourcetype"
                onkeydown="if(event.key === 'Enter') runSearch()"
              />
            </div>

            <!-- Time Range Selector -->
            <select class="bg-[#0d131c] border border-[#34455d] text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none font-medium">
              <option selected>Last 24 hours</option>
              <option>Last 15 minutes</option>
              <option>Last 7 days</option>
              <option>All time</option>
              <option>Real-time (1 minute window)</option>
            </select>

            <!-- Search Execute Button -->
            <button 
              onclick="runSearch()" 
              class="px-6 py-2.5 rounded-xl bg-[#ea0089] hover:bg-[#d00079] text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-[#ea0089]/30 active:scale-95 cursor-pointer"
            >
              <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
              <span>Search</span>
            </button>
          </div>

          <!-- SPL Sample Queries -->
          <div class="flex items-center gap-2 flex-wrap text-[11px] pt-1">
            <span class="text-slate-400">Quick Searches:</span>
            <button onclick="setQuery('index=_internal sourcetype=splunkd | stats count by log_level')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition">| stats count by log_level</button>
            <button onclick="setQuery('index=_audit action=login | table _time, user, info')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition">index=_audit action=login</button>
            <button onclick="setQuery('index=* error OR fail OR warn | head 25')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 font-mono transition">error OR fail OR warn</button>
            <button onclick="setQuery('| rest /services/server/info | fields splunk_server, version, os_name, cpu_arch')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono transition">| rest /services/server/info</button>
          </div>
        </div>

        <!-- Search Results View Grid (Fields + Timeline + Events) -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          <!-- Left Column: Discovered Fields Sidebar -->
          <div class="p-4 rounded-xl bg-[#18212e] border border-[#2b3a4e] space-y-3">
            <div class="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-700/80">
              Selected Fields
            </div>
            <div class="space-y-1.5 text-xs font-mono">
              <div class="flex items-center justify-between p-1.5 rounded bg-slate-800/60 text-slate-200">
                <span class="text-[#ea0089]">a</span>
                <span class="font-sans text-[11px] font-bold">host (1)</span>
                <span class="text-slate-400 text-[10px]">100%</span>
              </div>
              <div class="flex items-center justify-between p-1.5 rounded bg-slate-800/60 text-slate-200">
                <span class="text-[#ea0089]">a</span>
                <span class="font-sans text-[11px] font-bold">source (3)</span>
                <span class="text-slate-400 text-[10px]">100%</span>
              </div>
              <div class="flex items-center justify-between p-1.5 rounded bg-slate-800/60 text-slate-200">
                <span class="text-[#ea0089]">a</span>
                <span class="font-sans text-[11px] font-bold">sourcetype (2)</span>
                <span class="text-slate-400 text-[10px]">100%</span>
              </div>
              <div class="flex items-center justify-between p-1.5 rounded bg-slate-800/60 text-slate-200">
                <span class="text-[#ea0089]">#</span>
                <span class="font-sans text-[11px] font-bold">linecount</span>
                <span class="text-slate-400 text-[10px]">100%</span>
              </div>
            </div>

            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider pt-3 pb-1 border-t border-slate-700/80">
              Interesting Fields
            </div>
            <div class="space-y-1 text-xs text-slate-300">
              <div class="py-1 px-1.5 hover:bg-slate-800 rounded flex justify-between cursor-pointer">
                <span>component</span> <span class="text-slate-500 text-[10px]">8</span>
              </div>
              <div class="py-1 px-1.5 hover:bg-slate-800 rounded flex justify-between cursor-pointer">
                <span>log_level</span> <span class="text-slate-500 text-[10px]">3</span>
              </div>
              <div class="py-1 px-1.5 hover:bg-slate-800 rounded flex justify-between cursor-pointer">
                <span>pid</span> <span class="text-slate-500 text-[10px]">4</span>
              </div>
            </div>
          </div>

          <!-- Right 3-Columns: Job Bar + Timeline Histogram + Events Table -->
          <div class="lg:col-span-3 space-y-4">
            
            <!-- Job Summary & Stats -->
            <div class="p-3.5 rounded-xl bg-[#18212e] border border-[#2b3a4e] flex items-center justify-between text-xs">
              <div class="flex items-center gap-3 font-sans">
                <span class="font-bold text-white flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span id="events-count-label">30 Events matched</span>
                </span>
                <span class="text-slate-400 font-mono text-[11px]" id="job-time-label">(0.038 seconds)</span>
              </div>

              <div class="flex items-center gap-2 font-mono text-[11px]">
                <span class="px-2 py-0.5 rounded bg-[#0d131c] text-slate-300 border border-slate-800">Job: 1727599284.102</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">100% COMPLETE</span>
              </div>
            </div>

            <!-- Events List Output -->
            <div class="p-4 rounded-xl bg-[#18212e] border border-[#2b3a4e] space-y-2" id="events-list">
              <!-- Event Row 1 -->
              <div class="p-3 rounded-lg bg-[#0d131c] border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1 hover:border-[#ea0089]/50 transition">
                <div class="flex items-center gap-3 text-[10px] text-slate-400">
                  <span class="text-emerald-400 font-bold">${new Date().toLocaleTimeString()}</span>
                  <span>host=<strong>${serverName}</strong></span>
                  <span>source=<strong>/opt/splunk_parallel/var/log/splunk/splunkd.log</strong></span>
                  <span>sourcetype=<strong>splunkd</strong></span>
                </div>
                <div class="text-slate-200 leading-relaxed">
                  09-29-2026 ${new Date().toLocaleTimeString()} INFO  loader - Server is ready and accepting REST / HTTP connections on port ${port}.
                </div>
              </div>

              <!-- Event Row 2 -->
              <div class="p-3 rounded-lg bg-[#0d131c] border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1 hover:border-[#ea0089]/50 transition">
                <div class="flex items-center gap-3 text-[10px] text-slate-400">
                  <span class="text-emerald-400 font-bold">${new Date().toLocaleTimeString()}</span>
                  <span>host=<strong>${serverName}</strong></span>
                  <span>source=<strong>/opt/splunk_parallel/var/log/splunk/splunkd_access.log</strong></span>
                  <span>sourcetype=<strong>splunkd_access</strong></span>
                </div>
                <div class="text-slate-200 leading-relaxed">
                  127.0.0.1 - admin [29/Sep/2026:${new Date().toLocaleTimeString()}] "GET /en-US/app/launcher/home HTTP/1.1" 200 4819 "http://localhost:${port}/"
                </div>
              </div>

              <!-- Event Row 3 -->
              <div class="p-3 rounded-lg bg-[#0d131c] border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1 hover:border-[#ea0089]/50 transition">
                <div class="flex items-center gap-3 text-[10px] text-slate-400">
                  <span class="text-emerald-400 font-bold">${new Date().toLocaleTimeString()}</span>
                  <span>host=<strong>${serverName}</strong></span>
                  <span>source=<strong>/opt/splunk_parallel/etc/system/local/web.conf</strong></span>
                  <span>sourcetype=<strong>splunk_web_service</strong></span>
                </div>
                <div class="text-slate-200 leading-relaxed">
                  09-29-2026 ${new Date().toLocaleTimeString()} INFO  CherryPyAppServer - Splunk Web Application Server initialized successfully on httpport = ${port}.
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      <!-- ================= DASHBOARDS TAB ================= -->
      <div id="tab-dashboards" class="hidden space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-700">
          <div>
            <h2 class="text-base font-bold text-white">Cluster Health &amp; Indexer Performance Dashboard</h2>
            <p class="text-xs text-slate-400">Real-time telemetry and throughput for ${serverName}</p>
          </div>
          <button class="px-3.5 py-1.5 rounded-xl bg-[#ea0089] text-white text-xs font-bold">Edit Dashboard</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded-xl bg-[#18212e] border border-[#2b3a4e] space-y-1">
            <span class="text-xs text-slate-400 font-medium">Daily Indexing Volume</span>
            <div class="text-2xl font-bold text-white font-mono">14.8 GB</div>
            <div class="text-xs text-emerald-400 font-medium">+12% vs yesterday</div>
          </div>

          <div class="p-4 rounded-xl bg-[#18212e] border border-[#2b3a4e] space-y-1">
            <span class="text-xs text-slate-400 font-medium">Search Concurrency</span>
            <div class="text-2xl font-bold text-cyan-400 font-mono">3 Active / 16 Max</div>
            <div class="text-xs text-slate-400">Zero search queue delay</div>
          </div>

          <div class="p-4 rounded-xl bg-[#18212e] border border-[#2b3a4e] space-y-1">
            <span class="text-xs text-slate-400 font-medium">Storage IOPS &amp; Bucket State</span>
            <div class="text-2xl font-bold text-emerald-400 font-mono">OPTIMAL</div>
            <div class="text-xs text-slate-400">Hot/Warm paths clean</div>
          </div>
        </div>
      </div>

    </main>

    <!-- Splunk Console Footer -->
    <footer class="bg-[#18212e] border-t border-[#28374a] py-3 px-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="font-bold text-slate-300">&gt;splunk&gt; Enterprise ${version}</span>
        <span>•</span>
        <span>Build 9.2.1-e781a9</span>
        <span>•</span>
        <span>Instance: <strong class="text-slate-300">${serverName}</strong></span>
      </div>
      <div class="flex items-center gap-4 text-slate-400">
        <a href="#" class="hover:underline">Documentation</a>
        <a href="#" class="hover:underline">Support &amp; Community</a>
      </div>
    </footer>

  </div>

  <script>
    // State management
    let isAuthenticated = false;

    function handleLoginSubmit(e) {
      e.preventDefault();
      const user = document.getElementById('login-username').value.trim();
      const pass = document.getElementById('login-password').value.trim();

      // Accept admin credentials
      if (user) {
        isAuthenticated = true;
        document.getElementById('console-username').innerText = user;
        document.getElementById('splunk-login-view').classList.add('hidden');
        document.getElementById('splunk-console-view').classList.remove('hidden');
        document.getElementById('splunk-console-view').classList.add('flex');
        window.history.replaceState({}, '', '/en-US/app/launcher/home');
      } else {
        document.getElementById('login-error').classList.remove('hidden');
      }
    }

    function handleLogout() {
      isAuthenticated = false;
      document.getElementById('splunk-console-view').classList.add('hidden');
      document.getElementById('splunk-console-view').classList.remove('flex');
      document.getElementById('splunk-login-view').classList.remove('hidden');
      window.history.replaceState({}, '', '/en-US/account/login');
    }

    function toggleDropdown(id) {
      const el = document.getElementById(id);
      const isHidden = el.classList.contains('hidden');
      // close others
      ['apps-menu', 'settings-menu', 'activity-menu', 'user-menu'].forEach(menuId => {
        const m = document.getElementById(menuId);
        if (m) m.classList.add('hidden');
      });
      if (isHidden) {
        el.classList.remove('hidden');
      }
    }

    function selectApp(name, key) {
      document.getElementById('active-app-name').innerText = name;
      toggleDropdown('apps-menu');
      switchAppTab(key);
    }

    function switchAppTab(tabKey) {
      ['tab-search', 'tab-dashboards'].forEach(tab => {
        const t = document.getElementById(tab);
        if (t) t.classList.add('hidden');
      });
      if (tabKey === 'dashboards') {
        document.getElementById('tab-dashboards').classList.remove('hidden');
      } else {
        document.getElementById('tab-search').classList.remove('hidden');
      }
    }

    function setQuery(q) {
      document.getElementById('search-input').value = q;
      runSearch();
    }

    function runSearch() {
      const q = document.getElementById('search-input').value;
      const countEl = document.getElementById('events-count-label');
      const timeEl = document.getElementById('job-time-label');
      const listEl = document.getElementById('events-list');

      countEl.innerText = 'Executing query...';
      timeEl.innerText = '(searching indexes)';

      setTimeout(() => {
        const timeNow = new Date().toLocaleTimeString();
        const randCount = Math.floor(Math.random() * 40) + 15;
        countEl.innerText = randCount + ' Events matched';
        timeEl.innerText = '(' + (Math.random() * 0.05 + 0.015).toFixed(3) + ' seconds)';

        let html = '';
        for (let i = 0; i < Math.min(randCount, 6); i++) {
          html += \`
            <div class="p-3 rounded-lg bg-[#0d131c] border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1 hover:border-[#ea0089]/50 transition">
              <div class="flex items-center gap-3 text-[10px] text-slate-400">
                <span class="text-emerald-400 font-bold">\${timeNow}</span>
                <span>host=<strong>${serverName}</strong></span>
                <span>source=<strong>/opt/splunk_parallel/var/log/splunk/splunkd.log</strong></span>
                <span>sourcetype=<strong>splunkd</strong></span>
              </div>
              <div class="text-slate-200 leading-relaxed">
                09-29-2026 \${timeNow} \${q.includes('error') ? '<span class=\"text-rose-400 font-bold\">ERROR</span>' : '<span class=\"text-cyan-400 font-bold\">INFO</span>'} MetricsProcessor - name=index_thruput, rate=\${(Math.random() * 5 + 2).toFixed(2)} MB/s, cpu_usage=0.6%
              </div>
            </div>
          \`;
        }
        listEl.innerHTML = html;
      }, 350);
    }

    // Auto-login if ?autologin=1 or already signed in
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autologin') === '1') {
      handleLoginSubmit(new Event('submit'));
    }
  </script>
</body>
</html>`;
}
