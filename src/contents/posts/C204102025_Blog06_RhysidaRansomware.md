---
title: Malware Analyzing Series Blog 06
published: 2025-10-04
description: Rhysida Ransomware Analyze Blog.
tags: [PE, Blogging, Malware Analyze, Ransomware]
category: Malware Analyze
draft: false
---

# C204102025_A Case Study On Rhysida Ransomware

## Overview

Sample: `67a78b39e760e3460a135a7e4fa096ab6ce6b013658103890c866d9401928ba5`

So my team has started a new training session, and I was a part of it, this week was about analyzing a threat actor, but some how when I was wondering which one should I pick, then I receive a alert that one of the company that in my watch list got infected by a ransomware called **Rhysida**. So I decided to get a sample of it and analyze it =))).

When I got this one, it's a straight-up ransomware binary, no packer, no VM obfuscation, no anti-debug tricks just a plain MinGW-w64 PE64 with full symbols and a complete DWARF debug section still attached. It statically links **LibTomCrypt**, **LibTomMath**, and (oddly) **stb_truetype** / **stb_image_write**, which turns out to be how it renders its own ransom note into the desktop wallpaper.


## Fingerprinting

No packer signals at all. `list_imports` returns a boring, complete IAT across four DLLs (`ADVAPI32`, `KERNEL32`, `msvcrt`, `USER32`), `list_functions` returns real symbol names instead of IDA-generated `sub_*`, and the compile timestamp reads straight out of the PE header: `2023-05-15 23:29:10 UTC`. Whoever built this didn't bother hiding anything which made the static read fast, but also meant there was nothing to "crack" to get in, the work was all in understanding what it does.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_18.png)

The one that interesting that, the first line of the main function was calling `time(0i64)` to seed the C runtime's `rand()` function. This is can be a sign that the malware can be using a pseudo-random number generator (PRNG) to generate encryption keys or other sensitive data, it also means that if we knows the exact time the program was run, we may be able to reproduce the same sequence of random numbers and potentially recover any sensitive data that was generated using the PRNG.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot.png)

look into the `main()` function decompiles. First thing it does is seed the C runtime's `rand()` from the current time.

```c
Seed = time(0i64);
srand(Seed);          // this will be use later for encryption
```

## CLI Parsing

After that it will call `parseOptions`, checking this I found that it took the argument when running to choose what will the program do, there are 2 path the first one is `-d <path>` to scope encryption to a single directory, and the second one is  `-sr` for self-remove.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_2.png)

```c
strcpy(directory_modifier, "-d");       // argument 1 (point to a specific directory)
strcpy(self_remove_modifier, "-sr");    // argument 2 (this is used for self removal)
```

Surprisingly, `options->is_self_remove` is set to `1` unconditionally before the flag loop even runs this indicate The `-sr` flag is cosmetic the binary always tries to delete itself at the end regardless of what you pass it.

## Crypto Bring-up

Before touching any files, THE `main()` registers AES as a cipher, builds a CHC hash out of it (AES used as a compression function for hashing that's what LibTomCrypt's `chc_hash` construction does), imports an embedded RSA public key from a DER blob, and validates the AES key size.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_1.png)

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_3.png)

```c
if ( (unsigned int)rsa_import(_PUB_DER, _PUB_DER_LEN, &key) )
    puts("ERROR rsa_import_key public");
...
CIPHER = find_cipher("aes");
...
err = chc_register((unsigned int)CIPHER);   // bind AES into the CHC hash construction
...
HASH_IDX = find_hash("chc_hash");
```

`_aes_keysize` gets hard-set to `32` AES-256, confirmed before a single byte of a victim file is touched:

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_4.png)

```c
_aes_keysize = 32;
err = rijndael_keysize(&_aes_keysize);
```

Right after this, `main()` spins up one worker thread per logical CPU (`pthread_create(processFiles, ...)` in a loop over `PROCS`), then walks either the one directory passed via `-d` or every drive letter `A:` through `Z:` if none was given.

## Dispatch

Inside `processFileEnc`, there's a hard branch on a global called `CURRENT_TYPE_N` this will determine which path the program will take, if it's `1`  then it the encryption path. The other path is `2`, sadly when I tried to trace this path, it only lead to dead end:

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_5.png)

> This option execute the encryption. While there is another option but eventually this path is only a dead end, not a self decrypt mechanism.

We can confirm this inside the `main()` function where the only loop that actually runs is `for (CURRENT_TYPE_N = 1; CURRENT_TYPE_N <= 1; ...)`.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_19.png)

## Rename-Then-Encrypt

The file gets renamed to append `.rhysida` **before** it's opened for encryption.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_7.png)

```asm
mov    word ptr [rax], 2Eh      ; '.'
lea    rdx, __EXT_EXT           ; Source (extension name: rhysida)
call   strcat
...
call   rename                   ; NewFilename <- OldFilename + ".rhysida"
```

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_8.png)

> This is the part where it starting the execution the left function is the renaming function where it will add an extension (.rhysida) to every file. The bottom function actually the one starting the encryption by first opening and read all the bytes of the file.

The sequencing matters for recovery, if the rename fails partway through a large batch, it can end up with files that have the `.rhysida` extension but were never actually encrypted.

## AES-256-CTR

This is the part where the "magic" happen. 

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_9.png)

```c
// AES key 32 bytes, IV 16 bytes both pulled from the ChaCha20 PRNG
chacha20_prng_read(&cipher_key, 0x20, &prngs[thread_id]);
chacha20_prng_read(&cipher_IV, 0x10, &prngs[thread_id]);

ctr_start(CIPHER, IV, key, keylen=0x20, num_rounds=0x0E, ctr_mode=0, &ctr);
```

> Generate Key and IV using Mutual Exclusion Pseudo Random Number Generator (Mutex PRNG). 14 rounds = AES (default), 256 default, ctr_mode == 0 => CTR_COUNTER_LITTLE_ENDIAN.

After checking this function, it turn out that the malware is using AES-256, standard 14 rounds, CTR mode with a **little-endian** with the keystream generation is serialized behind one single global `MUTEX_PRNG` shared across every worker thread not per-thread. That's a means there's exactly one global sequence of key draws across the whole run.

## The Encryption Loop

Before going further into the encryption loop, I got a bit difficult this part since `processFileEnc` refused to decompile in Hex-Rays with "stack frame is too big." The function stages file data through a 1 MiB buffer *on the stack*, not the heap, so I have to read this whole section purely from the disassembly. T-T

```asm
mov   eax, 1032F8h      ; 0x103310 bytes with saved regs just over Hex-Rays' 1 MiB ceiling
call  ___chkstk_ms
sub   rsp, rax
```

I tried Patching the `chkstk` immediate down to something small this doesn't stick. Hex-Rays re-derives the frame size from the `[rbp+0x1032xx]` displacements actually used in the instruction stream, not from the `mov eax, imm` argument to `chkstk`. Re-analysis just regenerated the same stack variables and the frame snapped right back.

Then I tried splitting the function at the prologue boundary (`del_func` + `add_func` starting after `lea rbp, [rsp+80h]`) even with `frsize == 0` and zero declared stack variables, it *still* failed.

The entire chunk-loop logic in this post was reconstructed from raw disassembly instead T-T

## Intermittent Encryption Not Every Byte Gets Touched

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_11.png)

The encryption loop doesn't just AES-CTR the whole file. It computes up to 4 chunks of 1 MiB each, spread across the file by a shrinking-stride algorithm:

```c
blocks = 4;  stride = size / 4;  block_size = 0x100000;        // 1 MiB
while (stride != 0 && stride <= 0xFFFFF && blocks > 0) {
    blocks--;
    stride = size / blocks;
}
if (blocks == 0 || stride == 0) {                                // small file fallback
    blocks = 1; stride = block_size = size;
}
```

It turn out to be something like this:

| File size | blocks | stride | encrypted | coverage |
|---|---|---|---|---|
| ≤ 1 MiB | 1 | = size | whole file | **100%** |
| 2–3 MiB | 2–3 | 1 MiB | whole file | **100%** |
| 4 MiB − 1 | 3 | 1,398,101 | 3 MiB | 75% |
| 4 MiB | 4 | 1 MiB | whole file | **100%** |
| 8 MiB | 4 | 2 MiB | 4 MiB | 50% |
| 100 MiB | 4 | 25 MiB | 4 MiB | 4% |
| 1 GiB | 4 | 256 MiB | 4 MiB | **0.4%** |

So anything 4 MiB or smaller is a **total loss** without the key it's fully encrypted, contiguous chunks. Anything larger than 4 MiB is capped at exactly 4 MiB of damage no matter how big the file gets. A 1 GiB SQL dump keeps 99.6% of its bytes. That's the single most actionable fact for triage, and it only came out of actually running the transcribed algorithm rather than eyeballing the disassembly.


## RSA-Wrapped Key and IV Layout

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_10.png)

```asm
.data:0044C288  __PUB_DER_LEN  dd 550          ; Each RSA blob is 512 bytes
```

550 bytes of DER for a 4096-bit RSA public key (modulus + small exponent + ASN.1 overhead), which means every RSA operation produces exactly 512 bytes of ciphertext. The appended trailer, confirmed byte-for-byte from the `fwrite` call sequence:

```
RSA-4096-OAEP(AES key)  512 bytes
key blob length          4 bytes  (LE u32, always 512)
RSA-4096-OAEP(AES IV)   512 bytes
IV blob length           4 bytes  (LE u32, always 512)
type marker              4 bytes  (LE u32, always 1 for "encrypt")
-----------------------------------
total                 1036 bytes
```

The OAEP wrap uses the literal string `"Rhysida-0.1"` as its label parameter which is also the version string the binary reports of itself (`PROGRAM_NAME`). That's a nice, free fingerprint: any file whose trailer was generated with a different OAEP label is a different Rhysida build.

## Self-Deletion and Wallpaper Defacement

After the file-crawl finishes, the `main()` builds a self-delete command and calls `setBG()` to deface the wallpaper then it call `system()` call for self-delete:

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_6.png)

```c
setBG();                                  // deface the wallpaper
if ( options->is_self_remove == 1 ) {
    system(command);                      // running the self-deletion
    free(command);
}
```

```
cmd.exe /c start powershell.exe -WindowStyle Hidden -Command Sleep -Milliseconds 500; /
  Remove-Item -Force -Path "<cwd>/<argv[0]>" -ErrorAction SilentlyContinue;
```

`setBG()` itself is where the stb_truetype dependency comes in. It rasterizes the plaintext ransom note directly onto a 1920×1080 canvas using `C:/Windows/Fonts/Arial.ttf`, writes it to `C:/Users/Public/bg.jpg`, then runs eight separate `reg add`/`reg delete` commands to force it as the desktop background and lock the user out of changing it back:

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_15.png)

```c
img_width = 1920;  img_height = 1080;
padding_x = 40;    padding_y = 20;
img_quality = 100; image_color = 21;             // near-black fill
...
strcpy(font_filepath, "C:/Windows/Fonts/Arial.ttf");
```

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_16.png)

```c
sprintf(image_file, "C:/Users/Public/bg.jpg");
stbi_write_jpg(image_file, img_width, img_height, 1, image_data, img_quality);
...
system("cmd.exe /c reg delete /"HKCU//Conttol Panel//Desktop/" /v Wallpaper /f");
system("cmd.exe /c reg delete /"HKCU//Conttol Panel//Desktop/" /v WallpaperStyle /f");
system("cmd.exe /c reg add /"HKCU//...//Policies//ActiveDesktop/" /v NoChangingWallPaper /t REG_SZ /d 1 /f");
system("cmd.exe /c reg add /"HKLM//...//Policies//ActiveDesktop/" /v NoChangingWallPaper /t REG_SZ /d 1 /f");
system("cmd.exe /c reg add /"HKCU//Control Panel//Desktop/" /v Wallpaper /t REG_SZ /d /"C://Users//Public//bg.jpg/" /f");
system("cmd.exe /c reg add /"HKLM//...//Policies//System/" /v Wallpaper /t REG_SZ /d /"C://Users//Public//bg.jpg/" /f");
system("cmd.exe /c reg add /"HKLM//...//Policies//System/" /v WallpaperStyle /t REG_SZ /d 2 /f");
system("cmd.exe /c reg add /"HKCU//Control Panel//Desktop/" /v WallpaperStyle /t REG_SZ /d 2 /f");
system("rundll32.exe user32.dll,UpdatePerUserSystemParameters");
```

The funny thing is they misspelled `"Conttol Panel"` twice, in the two `reg delete` commands, while every other reference in the same function spells it correctly as `"Control Panel"`. 

This "Company" need to be capture for misspelling, in Vietnamese we have "Cảnh sát chính tả" which is grammar police haha =))).

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/images.jfif)


## The Ransom Note, the Address, and the Victim Key

Anyway let's go back to the malware, digging in the sample strings and function I found the plaintext note lives in `.data` as `__NOTE_TXT`, and it's also what gets dropped as `CriticalBreachDetected.pdf` in every single directory the malware touches (via `createNote` function, called once per directory node):

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_14.png)

```c
strcat(filename, _NOTE_NAME_PDF);     // "CriticalBreachDetected.pdf/x00/x00/x1A"
f = fopen(filename, "wb");
if ( f )
    fwrite(_NOTE_PDF, (unsigned int)_NOTE_PDF_LEN, 1ui64, f);
```

And the raw `.data` dump with the Tor address and the campaign ID (victim key) is right there in the ransom note text:

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_17.png)

```
.onion  : rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion
key     : 6F2PQ14O2POZ1JB5PSD65HUJP19Y9DU1
```

## Denylists Confirmed Two Different Ways

There are some files and directories that is excluded during the encryption process.

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_12.png)

```
.bat .bin .cab .cmd .com .cur .diagcab .diagcfg .diagpkg .drv .dll .exe
.hlp .hta .ico .lnk .msi .ocx .ps1 .psm1 .scr .sys .ini Thumbs.db .url .iso .cab
```

![alt text](https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/src/contents/asset/Rhysida_asset/Screenshot_13.png)

```
/$Recycle.Bin  /Boot  /Documents and Settings  /PerfLogs  /Program Files
/Program Files (x86)  /ProgramData  /Recovery  /System Volume Information
/Windows  /$RECYCLE.BIN
```

Standard "keep the box bootable so the ransom note can actually be read" targeting, just enough restraint to not brick the OS before the victim sees the demand.

## Building the Tool

### How to decrypt the encrypted files


The theoretically real recovery path is the PRNG weakness flagged right at the top of this post: `init_prng` seeds a ChaCha20-based PRNG using 40 bytes of entropy built from nothing but `rand()`, and `rand()` itself was seeded from `time(NULL)` at process start. That makes every key *reproducible* if you know the infection timestamp closely enough and replicate the exact sequence of `rand()` calls and thread/PRNG draw order which is nontrivial (it has to account for the per-thread draw interleaving under that global mutex)



## Detection

```yara
rule Rhysida_Ransomware_Win64
{
    meta:
        description = "Rhysida ransomware (MinGW-w64/LibTomCrypt build, Rhysida-0.1)"
        reference   = "67a78b39e760e3460a135a7e4fa096ab6ce6b013658103890c866d9401928ba5"

    strings:
        $ver   = "Rhysida-0.1" ascii fullword
        $ext   = "rhysida" ascii fullword
        $note  = "CriticalBreachDetected.pdf" ascii
        $onion = "rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion" ascii
        $typo  = "HKCU//Conttol Panel//Desktop" ascii   // author's own bug, reliable fingerprint
        $d1    = "ERROR rsa_encrypt_IV %s" ascii
        $d2    = "Start xxx_encrypt" ascii

    condition:
        uint16(0) == 0x5A4D and filesize < 4MB and
        ( ($ver and $ext) or $onion or $typo or (2 of ($d*) and $note) )
}
```

Behavioural angle, if you'd rather not depend on strings: `rundll32.exe user32.dll,UpdatePerUserSystemParameters` spawned right after a `reg add ... /Policies/ActiveDesktop /v NoChangingWallPaper` from the same parent process is about as specific a signature as this family gets.

## IOC Summary

| Type | Value |
|---|---|
| Extension | `.rhysida` |
| Note filename | `CriticalBreachDetected.pdf` |
| Wallpaper drop path | `C:/Users/Public/bg.jpg` |
| Tor portal | `rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion` |
| Victim/Campaign ID | `6F2PQ14O2POZ1JB5PSD65HUJP19Y9DU1` |
| RSA public key (DER SHA256) | `61b61297fa1e5239140824002a78f4b698ed94cc82462273b92afb11815c1b02` |
| Registry fingerprint | `HKCU/Conttol Panel/Desktop` |
| SHA256 | `67a78b39e760e3460a135a7e4fa096ab6ce6b013658103890c866d9401928ba5` |
