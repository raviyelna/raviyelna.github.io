<script lang="ts">
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";
  import {
    loadThreatIntel,
    sourceUrl,
    type IntelItem,
    type IntelKind,
  } from "../utils/threatIntel";

  type LoadState = "loading" | "ready" | "error";

  let activeKind: IntelKind = "cves";
  let status: LoadState = "loading";
  let cves: IntelItem[] = [];
  let campaigns: IntelItem[] = [];
  let updatedAt = "";
  let errorMessage = "";

  $: activeItems = activeKind === "cves" ? cves.slice(0, 6) : campaigns.slice(0, 6);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit",
    }).format(new Date(value));

  const normalizeSeverity = (severity?: string) => severity?.toLowerCase() || "";

  const loadIntel = async (force = false) => {
    status = "loading";
    errorMessage = "";

    try {
      const bundle = await loadThreatIntel(force);
      cves = bundle.cves;
      campaigns = bundle.campaigns;
      updatedAt = bundle.updatedAt;
      status = "ready";
    } catch (error) {
      status = "error";
      errorMessage =
        error instanceof Error ? error.message : "Threat intel feed failed";
    }
  };

  onMount(() => {
    loadIntel();
  });
</script>

<div class="flex w-full flex-row justify-center">
  <section
    class="onload-animation w-full rounded-3xl bg-[var(--card-color)] p-3"
    style="animation-delay: calc(var(--onload-animation-delay) + 4 * var(--onload-animation-interval));"
  >
    <div class="mb-3 flex items-center justify-between gap-2">
      <div class="title m-[0.375rem]">
        <span class="pl-4 text-xl font-bold text-[var(--text-color)]">
          Threat Intel
        </span>
      </div>
      <button
        type="button"
        class="rounded-lg p-2 text-[var(--text-color-lighten)] transition-all hover:bg-[var(--primary-color-lighten)] hover:text-[var(--primary-color)]"
        aria-label="Refresh threat intel"
        on:click={() => loadIntel(true)}
      >
        <Icon icon="mingcute:refresh-2-line" width={18} height={18} />
      </button>
    </div>

    <div class="mb-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        class={`rounded-lg px-2 py-2 text-sm transition-all ${
          activeKind === "cves"
            ? "bg-[var(--primary-color)] text-white"
            : "bg-[var(--primary-color-lighten)] text-[var(--primary-color)]"
        }`}
        on:click={() => (activeKind = "cves")}
      >
        CVEs
      </button>
      <button
        type="button"
        class={`rounded-lg px-2 py-2 text-sm transition-all ${
          activeKind === "campaigns"
            ? "bg-[var(--primary-color)] text-white"
            : "bg-[var(--primary-color-lighten)] text-[var(--primary-color)]"
        }`}
        on:click={() => (activeKind = "campaigns")}
      >
        Campaigns
      </button>
    </div>

    {#if status === "loading"}
      <div class="space-y-2">
        {#each Array(4) as _}
          <div class="h-20 animate-pulse rounded-xl bg-[var(--primary-color-lighten)]"></div>
        {/each}
      </div>
    {:else if status === "error"}
      <div class="rounded-xl bg-[var(--primary-color-lighten)] p-3">
        <p class="text-sm font-medium text-[var(--text-color)]">Feed unavailable</p>
        <p class="mt-1 text-xs text-[var(--text-color-lighten)]">{errorMessage}</p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each activeItems as item}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            class="block rounded-xl bg-[var(--background-color)] p-3 transition-all hover:bg-[var(--primary-color-lighten)]"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <span
                class="rounded-md bg-[var(--primary-color-lighten)] px-2 py-0.5 text-xs font-semibold text-[var(--primary-color)]"
              >
                {activeKind === "cves" ? item.id : item.source}
              </span>
              <span class="shrink-0 text-xs text-[var(--text-color-lighten)]">
                {formatDate(item.date)}
              </span>
            </div>
            <p class="line-clamp-2 text-sm font-semibold leading-5 text-[var(--text-color)]">
              {item.title}
            </p>
            {#if activeKind === "cves" && (item.vendor || item.product)}
              <p class="mt-1 truncate text-xs text-[var(--text-color-lighten)]">
                {item.vendor} / {item.product}
              </p>
            {/if}
            <div class="mt-2 flex flex-wrap gap-1.5">
              <span
                class="rounded bg-black/5 px-1.5 py-0.5 text-[0.68rem] text-[var(--text-color-lighten)] dark:bg-white/10"
              >
                {item.source}
              </span>
              {#if item.severity}
                <span
                  class={`rounded px-1.5 py-0.5 text-[0.68rem] ${
                    normalizeSeverity(item.severity) === "critical"
                      ? "bg-red-500 text-white"
                      : normalizeSeverity(item.severity) === "high"
                        ? "bg-orange-500 text-white"
                        : "bg-black/5 text-[var(--text-color-lighten)] dark:bg-white/10"
                  }`}
                >
                  {item.severity}
                </span>
              {/if}
              {#if item.ransomware === "Known"}
                <span class="rounded bg-red-500 px-1.5 py-0.5 text-[0.68rem] text-white">
                  Ransomware
                </span>
              {/if}
            </div>
          </a>
        {/each}
      </div>

      <div class="mt-3 flex items-center justify-between gap-2 text-xs text-[var(--text-color-lighten)]">
        <span>{updatedAt ? `Updated ${updatedAt}` : "Live feed"}</span>
        <a
          href={sourceUrl(activeItems[0]?.source)}
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--primary-color)] hover:brightness-90"
        >
          Source
        </a>
      </div>
    {/if}
  </section>
</div>

<style>
  .title {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
  }

  .title::before {
    position: absolute;
    display: block;
    content: " ";
    background-color: var(--primary-color);
    top: 3px;
    bottom: 3px;
    width: 0.3rem;
    border-radius: 4px;
  }
</style>
