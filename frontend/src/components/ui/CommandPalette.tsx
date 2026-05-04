"use client";

import type { ReactNode } from "react";

import { Command } from "cmdk";

import cn from "@/lib/cn";

interface CommandPaletteItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onSelect?: () => void;
  group?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandPaletteItem[];
}

function CommandPaletteEntry({
  item,
  onOpenChange,
}: {
  item: CommandPaletteItem;
  onOpenChange: (open: boolean) => void;
}) {
  const content = (
    <>
      {item.icon ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-fg-muted">
          {item.icon}
        </span>
      ) : null}
      <span className="truncate">{item.label}</span>
    </>
  );

  if (item.href) {
    return (
      <Command.Item
        value={item.label}
        onSelect={() => {
          item.onSelect?.();
          onOpenChange(false);
        }}
        asChild
        className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-fg-secondary transition-colors aria-selected:bg-white/8 aria-selected:text-fg-primary"
      >
        <a href={item.href} className="mx-2 flex items-center gap-3">
          {content}
        </a>
      </Command.Item>
    );
  }

  return (
    <Command.Item
      value={item.label}
      onSelect={() => {
        item.onSelect?.();
        onOpenChange(false);
      }}
      className="mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-fg-secondary transition-colors aria-selected:bg-white/8 aria-selected:text-fg-primary"
    >
      {content}
    </Command.Item>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
}: CommandPaletteProps) {
  if (!open) {
    return null;
  }

  const groupedItems = items.reduce<Record<string, CommandPaletteItem[]>>(
    (accumulator, item) => {
      const groupName = item.group ?? "";
      const group = accumulator[groupName] ?? [];
      group.push(item);
      accumulator[groupName] = group;
      return accumulator;
    },
    {}
  );

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative mx-auto mt-[20vh] w-full max-w-xl px-4">
        <Command
          label="Command palette"
          className="surface-glass w-full overflow-hidden rounded-2xl shadow-card-lift"
        >
          <Command.Input
            placeholder="Search actions..."
            className={cn(
              "w-full border-b border-border-subtle bg-transparent px-4 py-3 text-sm text-fg-primary outline-none",
              "placeholder:text-fg-muted"
            )}
          />
          <Command.List className="scrollbar-hidden max-h-80 overflow-y-auto py-2">
            <Command.Empty className="py-8 text-center text-sm text-fg-muted">
              No results found.
            </Command.Empty>

            {Object.entries(groupedItems).map(([groupName, groupItems]) =>
              groupName ? (
                <Command.Group
                  key={groupName}
                  heading={groupName}
                  className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-fg-tertiary"
                >
                  {groupItems.map((item) => (
                    <CommandPaletteEntry
                      key={item.id}
                      item={item}
                      onOpenChange={onOpenChange}
                    />
                  ))}
                </Command.Group>
              ) : (
                groupItems.map((item) => (
                  <CommandPaletteEntry
                    key={item.id}
                    item={item}
                    onOpenChange={onOpenChange}
                  />
                ))
              )
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
