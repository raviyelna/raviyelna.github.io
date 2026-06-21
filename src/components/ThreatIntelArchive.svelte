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
  let query = "";
  let errorMessage = "";

  $: allItems = activeKind === "cves" ? cves : campaigns;
  $: visibleItems = allItems.filter((item) => {
    const haystack = `${item.id} ${item.title} ${item.vendor ?? ""} ${item.product ?? ""} ${item.summary} ${item.source}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en", {
      year: "numeric",
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

<section class="intel-wrapper">
  <div class="intel-header">
    <div>
      <h1>Threat Intel</h1>
      <p>Live CVE exploitation signals and campaign reports from public sources.</p>
    </div>
    <button type="button" on:click={() => loadIntel(true)}>
      <Icon icon="mingcute:refresh-2-line" width={18} height={18} />
      <span>Refresh</span>
    </button>
  </div>

  <div class="intel-controls">
    <div class="tabs">
      <button
        type="button"
        class:active={activeKind === "cves"}
        on:click={() => (activeKind = "cves")}
      >
        CVEs
      </button>
      <button
        type="button"
        class:active={activeKind === "campaigns"}
        on:click={() => (activeKind = "campaigns")}
      >
        Campaigns
      </button>
    </div>
    <label>
      <Icon icon="mingcute:search-line" width={18} height={18} />
      <input bind:value={query} placeholder="Search intel" />
    </label>
  </div>

  {#if status === "loading"}
    <div class="intel-grid">
      {#each Array(6) as _}
        <div class="skeleton"></div>
      {/each}
    </div>
  {:else if status === "error"}
    <div class="empty-state">
      <p>Threat intel feed unavailable.</p>
      <span>{errorMessage}</span>
    </div>
  {:else}
    <div class="feed-meta">
      <span>{visibleItems.length} item(s)</span>
      <span>/</span>
      <span>{updatedAt ? `Updated ${updatedAt}` : "Live feed"}</span>
    </div>

    <div class="intel-grid">
      {#each visibleItems as item}
        <article class="intel-card">
          <div class="card-top">
            <span>{activeKind === "cves" ? item.id : item.source}</span>
            <time datetime={item.date}>{formatDate(item.date)}</time>
          </div>
          <a href={item.url} target="_blank" rel="noopener noreferrer" class="card-title">
            {item.title}
          </a>
          {#if activeKind === "cves" && (item.vendor || item.product)}
            <p class="asset-line">{item.vendor} / {item.product}</p>
          {/if}
          <p class="summary">{item.summary}</p>
          <div class="badges">
            <a href={sourceUrl(item.source)} target="_blank" rel="noopener noreferrer">
              {item.source}
            </a>
            {#if item.severity}
              <span
                class={`severity ${
                  normalizeSeverity(item.severity) === "critical"
                    ? "critical"
                    : normalizeSeverity(item.severity) === "high"
                      ? "high"
                      : ""
                }`}
              >
                {item.severity}
              </span>
            {/if}
            {#if item.ransomware === "Known"}
              <span class="ransomware">Ransomware</span>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .intel-wrapper {
    @apply mx-3 rounded-2xl bg-[var(--card-color)] px-5 py-6 lg:mx-0 lg:px-10 lg:py-9;
  }

  .intel-header {
    @apply flex flex-col gap-4 border-b border-[var(--primary-color-lighten)] pb-6 md:flex-row md:items-start md:justify-between;
  }

  .intel-header h1 {
    @apply text-3xl font-bold text-[var(--text-color)];
    font-family: var(--title-font);
  }

  .intel-header p,
  .feed-meta,
  .asset-line,
  .summary {
    @apply text-sm text-[var(--text-color-lighten)];
    font-family: var(--primary-font);
  }

  .intel-header button {
    @apply inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--primary-color-lighten)] px-4 font-medium text-[var(--primary-color)] transition-all hover:brightness-95;
    font-family: var(--primary-font);
  }

  .intel-controls {
    @apply my-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between;
  }

  .tabs {
    @apply grid grid-cols-2 gap-2 md:w-72;
  }

  .tabs button {
    @apply rounded-lg bg-[var(--primary-color-lighten)] px-4 py-2 text-sm font-medium text-[var(--primary-color)] transition-all;
    font-family: var(--primary-font);
  }

  .tabs button.active {
    @apply bg-[var(--primary-color)] text-white;
  }

  label {
    @apply flex h-11 items-center gap-2 rounded-lg bg-[var(--background-color)] px-3 text-[var(--text-color-lighten)] md:w-72;
  }

  input {
    @apply w-full bg-transparent text-sm text-[var(--text-color)] outline-none;
    font-family: var(--primary-font);
  }

  .feed-meta {
    @apply mb-4 flex gap-2;
  }

  .intel-grid {
    @apply grid grid-cols-1 gap-4 lg:grid-cols-2;
  }

  .intel-card,
  .skeleton,
  .empty-state {
    @apply rounded-xl border border-[var(--primary-color-lighten)] bg-[var(--background-color)] p-5;
  }

  .intel-card {
    @apply transition-all hover:-translate-y-1 hover:border-[var(--primary-color)] hover:shadow-lg;
  }

  .card-top {
    @apply mb-3 flex items-center justify-between gap-3 text-xs text-[var(--text-color-lighten)];
    font-family: var(--primary-font);
  }

  .card-top span {
    @apply truncate rounded-md bg-[var(--primary-color-lighten)] px-2 py-1 font-semibold text-[var(--primary-color)];
  }

  .card-title {
    @apply line-clamp-2 text-lg font-semibold leading-6 text-[var(--text-color)] transition-colors hover:text-[var(--primary-color)];
    font-family: var(--primary-font);
  }

  .asset-line {
    @apply mt-2 truncate;
  }

  .summary {
    @apply mt-3 line-clamp-4 leading-6;
  }

  .badges {
    @apply mt-4 flex flex-wrap gap-2;
  }

  .badges a,
  .badges span {
    @apply rounded-md bg-black/5 px-2 py-1 text-xs text-[var(--text-color-lighten)] dark:bg-white/10;
    font-family: var(--primary-font);
  }

  .badges a {
    @apply text-[var(--primary-color)];
  }

  .badges .critical,
  .badges .ransomware {
    @apply bg-red-500 text-white;
  }

  .badges .high {
    @apply bg-orange-500 text-white;
  }

  .skeleton {
    @apply h-60 animate-pulse;
  }

  .empty-state p {
    @apply font-semibold text-[var(--text-color)];
    font-family: var(--primary-font);
  }

  .empty-state span {
    @apply mt-1 block text-sm text-[var(--text-color-lighten)];
    font-family: var(--primary-font);
  }
</style>
