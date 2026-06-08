import { headers } from "next/headers";

export function getDeviceDetails() {
  const userAgent = headers().get("user-agent");

  if (!userAgent) throw "no userAgent found";

  // Detect OS
  let os = "Unknown OS";
  if (userAgent.includes("Win")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "MacOS";
  else if (userAgent.includes("X11") || userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("like Mac")) os = "iOS";

  // Detect Device Type
  let device = "Desktop";
  if (/Mobi|Android/i.test(userAgent)) device = "Mobile";
  else if (/iPad|Tablet/i.test(userAgent)) device = "Tablet";

  // Detect Browser
  let browser = "Unknown Browser";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR"))
    browser = "Google Chrome";
  else if (userAgent.includes("Firefox")) browser = "Mozilla Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Microsoft Edge";
  else if (userAgent.includes("OPR") || userAgent.includes("Opera")) browser = "Opera";
  else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) browser = "Internet Explorer";

  // Extract Browser Version
  const browserVersionMatch = userAgent.match(/(Chrome|Firefox|Safari|Edg|OPR|Version|MSIE|Trident)\/([\d.]+)/);
  let browserVersion = browserVersionMatch ? browserVersionMatch[2] : "Unknown";

  // Detect Rendering Engine
  let engine = "Unknown Engine";
  if (userAgent.includes("AppleWebKit")) engine = "WebKit";
  if (userAgent.includes("Gecko") && !userAgent.includes("like Gecko")) engine = "Gecko";
  if (userAgent.includes("Chrome") || userAgent.includes("Edg") || userAgent.includes("Opera")) engine = "Blink";
  if (userAgent.includes("Trident")) engine = "Trident (IE Engine)";

  // Detect CPU Architecture
  let architecture = "Unknown";
  if (userAgent.includes("WOW64") || userAgent.includes("Win64")) architecture = "64-bit";
  else if (userAgent.includes("x86") || userAgent.includes("i686")) architecture = "32-bit";
  else if (userAgent.includes("ARM")) architecture = "ARM";

  return { os, device, browser, browserVersion, engine, architecture };
}

export async function getGeoLocationDetails(): Promise<{ city: string }> {
  const response = await fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .catch((err) => {
      console.log("getGeoLocationDetails error:", err);
      throw err;
    });

  return response;
}
