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
![]({{site.url}}/Writeup_images/PCTF/Slingshot/Slingshot.png