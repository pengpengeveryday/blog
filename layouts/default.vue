<template>
  <div class="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
    <div class="mx-auto max-w-3xl px-4 py-8">
      <header class="mb-12">
        <nav class="flex items-center justify-between">
          <NuxtLink to="/" class="text-xl font-bold tracking-tight hover:text-blue-600">
            My Blog
          </NuxtLink>
          <div class="flex items-center gap-4">
            <NuxtLink to="/new" class="text-sm text-zinc-500 hover:text-blue-600 transition-colors">
              New
            </NuxtLink>
            <NuxtLink to="/tags" class="text-sm text-zinc-500 hover:text-blue-600 transition-colors">
              Tags
            </NuxtLink>
          </div>
        </nav>
      </header>
      <main>
        <slot />
      </main>
      <footer class="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-6 text-sm text-zinc-500 text-center">
        &copy; {{ new Date().getFullYear() }} My Blog. All rights reserved.
      </footer>
    </div>
  </div>
</template>
