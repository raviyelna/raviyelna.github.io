---
title:  Trap Job Write-up
published: 2025-07-17
description:  Cyberdefender 2024 - Trap Job Write-up
tags: [ DFIR, RE]
category: Cyberdefender Write-up
draft: true
---

# Cyberdefender 2024 - Trap Job Write-up

## Table of Contents:
- [Case Summary](#case-summary)
- [Analysis](#analysis)
  - [Initial access](#initial-access)
  - [Execution](#execution)
  - [Command and Control](#command-and-control)
  - [Persistence](#persistence)
  - [Discovery](#discovery)
  - [Collection](#collection)
  - [Exfiltrate](#exfiltration)
- [Indicators of Compromise](#indicators-of-compromise)

## Case Summary

### Scenario

The SOC team received a high-priority alert regarding suspicious activity on an employee's workstation. The alert indicated that a Word document containing malicious macros was executed, followed by an established connection to a suspicious web server. After asking the affected employee, we found that he had opened what appeared to be a job application resume earlier that morning, enabling macros when prompted.

As a forensics investigator, you have been provided with a disk triage of the victim's workstation and tasked with conducting a comprehensive analysis to reconstruct the attack timeline, identify all malicious artifacts, and determine the full extent of the compromise.

### Objectives

Analyze PowerShell and Sysmon logs to investigate macro-based malware, identify persistence via scheduled tasks, and extract C2 indicators and keylogger behavior using AutOpsy and olevba.

### Diagram

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/flow.drawio.png)

## Initial Access

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image.png)

Tracing back to the start point, according to the given scenario the employee downloaded the document, by checking the browser history which is stored in `C:\Users\<Username>\AppData\Local\Google\Chrome\User Data\Default` and can be opened using SQLite or DB browser for sqlite, there was some document but only one file which contains the **".docm"** extension, this indicated that this document contains Visual Basic macro script (VBS macro), 

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-1.png)

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-2.png)

## Analysis

### Execution

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-3.png)

After the victim opened the document, the malicious macro was executed, which can be seen using Olevba or Open the macro function in the winword.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-4.png)

As the macro executed it will drop 3 files which are **Script.ps1**, **Temp.ps1**, **Updater.vbs** in the `C:\Users\Administrator\AppData\Local\Microsoft\Windows\Update` after the victim close the document, the macro will create a new schedule to execute the vbs script it dropped.
![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-26.png)

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-5.png)

### Command and Control

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-22.png)

As for the **Script.ps1**, getting the code out from the powershell/operations windows eventlog is possible but since the location is clearly given in the script, execute the script to get the **script.ps1** is way faster.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-6.png)

The script is heavily obfuscated but with a bit of handwork we can get the C2 server address and understand some part of the script did.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-7.png)

So far, the temp.ps1 is used as the C2 handler, which will execute command, if there are "RES!#%" before the argument given into the **temp.ps1** then its a response send from the victim to the C2 server, otherwise it will be a command to be executed on the victim's machine.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-27.png)

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-28.png)

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-29.png)

The argument listened from the C2 server then save as "c.txt" in the `C:\Users\Administrator\AppData\Local\Microsoft\Windows\Update` folder, and then executed using powershell.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-30.png)

### Persistence

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-8.png)

Task scheduled can be check by 2 ways, using registry key or task folder, which is located in `C:\Windows\System32\Tasks`, there are 2 suspicious task has been created with the time is perfectly fit into the time when the victim opened the document.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-9.png)

```xml
   <TimeTrigger>
      <Repetition>
        <Interval>PT10M</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>2022-06-21T00:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <RandomDelay>PT1M</RandomDelay>
    </TimeTrigger>
```

The first one, `WindowsUpdate` will run the `Updater.vbs` using wscript every 10 minutes, the second one, `WindowsUpdateTask` will run the `Script.ps1` every 10 minutes, which will execute the `Script.ps1` to connect to the C2 domain.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-10.png)

This is the Visual basic script in **Updater.vbs**, which will run some kind of commandline after decoded.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-11.png)

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-12.png)

Retrieve the code using messageBox and get rid of the obj.run is the fastest way to do this.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-13.png)

And for the second task which can be execute remotely, this can be check using windows eventlog, since the name of the task is clearly given above.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-14.png)

### Discovery

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-15.png)

Digging into the Log a bit, there a suspicious remote execution of the **temp.ps1** which contain a argument and this can be translated into ``whoami /all``.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-24.png)

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-25.png)

```
HostApplication=C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -exec bypass -file C:\Users\Administrator\AppData\Local\Microsoft\Windows\Update\temp.ps1 MCFAI0VXUTY1NCFAI0VXUXdob2FtaSAvYWxs
 //debas64: 0!@#EWQ654!@#EWQwhoami /all
```

### Collection

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-23.png)

After connecting to the C2 server, the script will download a keylogger which is `Module.exe` and stored in `C:\Users\public\module` along side with it's config and the task that will execute itself with another powershell script.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-18.png)

The PE was actually a AutoHotKey which can be used as a keylogger.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-17.png)

Another way to know the origin of this file is using **Resource hacker** which contains the original metadata and resources of the PE.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-31.png)

and inside the config file, is the location of the data it stored as template before exfiltrate to the C2 server.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-16.png)

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-19.png)

### Exfiltration

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-20.png)

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/trapjob_asset/image-21.png)

## Indicators of Compromise

C2: 63[.]178[.]197[.]110

Module.exe: 25bb276aab41e22dbeb1709225d57fa8237f829e809453cbb0d60b6abf1b6c79 (SHA256)

Apply Form.docm: 17a28ae2f57b211c18711244e5adaff5425b9753d85d94c1063049abafa1a3aa (SHA256)