"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { MUSIC_PRESETS, type MusicCategory } from "@/lib/content/music";
import { toVietnameseError } from "@/lib/data/errors";
import { useMusicActions, useMusicLinks } from "@/lib/data/music";
import { useOnline } from "@/lib/hooks/useOnline";
import { useYouTubeOpener } from "@/lib/hooks/useYouTubeOpener";
import { YouTubeModePicker } from "./YouTubeModePicker";
import {
  BRAIN_NOTE,
  musicItems,
  parseLinkTitle,
  type MusicItem,
} from "@/lib/rules/music";
import { parseYouTubeUrl, webUrl, youtubePath } from "@/lib/rules/youtube";

const TABS: { value: MusicCategory; label: string }[] = [
  { value: "relax", label: "Thư giãn / ru ngủ" },
  { value: "brain", label: "Phát triển trí não" },
];

export function MusicScreen({
  familyId,
  userId,
  isOwner,
}: {
  familyId: string;
  userId: string;
  isOwner: boolean;
}) {
  const links = useMusicLinks(familyId);
  const actions = useMusicActions(familyId);
  // Hiding and deleting need the network (spec §9); the add form says so once.
  const online = useOnline();
  const youtube = useYouTubeOpener();
  const [tab, setTab] = useState<MusicCategory>("relax");
  const [showHidden, setShowHidden] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const items = musicItems({
    presets: MUSIC_PRESETS,
    links: links.data ?? [],
    category: tab,
  });
  const hiddenCount = items.filter((item) => item.hidden).length;
  const showing = showHidden && hiddenCount > 0;
  const visible = items.filter((item) => showing || !item.hidden);
  const onError = (e: unknown) => setMessage(toVietnameseError(e));

  function toggleHidden(item: MusicItem) {
    setMessage(null);
    if (item.kind === "preset")
      actions.setPresetHidden.mutate(
        {
          presetCode: item.preset.presetCode,
          category: item.preset.category,
          hidden: !item.hidden,
        },
        { onError },
      );
    else
      actions.setLinkHidden.mutate(
        { id: item.link.id, hidden: !item.hidden },
        { onError },
      );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Nhạc cho bé</h1>
      <div role="tablist" className="grid grid-cols-2 gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`min-h-11 rounded-xl border px-2 ${tab === t.value ? "border-accent bg-accent-soft text-accent-ink" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <YouTubeModePicker mode={youtube.mode} onChange={youtube.setMode} />
      {tab === "brain" && (
        <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
          {BRAIN_NOTE}
        </p>
      )}
      {!online && (
        <p role="status" className="text-sm text-muted">
          Cần kết nối mạng để ẩn, hiện lại hoặc xóa.
        </p>
      )}
      <ul className="divide-y rounded-2xl border">
        {visible.map((item) => {
          const path = youtubePath(item.target);
          const canDelete =
            item.kind === "link" &&
            (isOwner || item.link.created_by === userId);
          return (
            <li key={item.key} className="flex flex-col gap-1 px-4 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => youtube.open(path)}
                  className={`flex min-h-12 flex-1 items-center text-left font-medium ${item.hidden ? "text-muted" : ""}`}
                >
                  ▶ {item.title}
                </button>
                <a
                  href={webUrl(path)}
                  target="_blank"
                  rel="noopener"
                  className="flex min-h-11 items-center px-2 text-sm text-accent-ink underline"
                >
                  Mở trên web
                </a>
              </div>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  disabled={!online}
                  onClick={() => toggleHidden(item)}
                  className="min-h-11 rounded-xl border px-3 disabled:opacity-50"
                >
                  {item.hidden ? "Hiện lại" : "Ẩn"}
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Xóa "${item.title}"?`)) {
                        setMessage(null);
                        actions.remove.mutate(item.link.id, { onError });
                      }
                    }}
                    disabled={!online}
                    className="min-h-11 rounded-xl border px-3 text-danger disabled:opacity-50"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowHidden(!showing)}
          className="min-h-11 rounded-xl border px-4"
        >
          {showing ? "Ẩn các mục đã ẩn" : `Hiện các mục đã ẩn (${hiddenCount})`}
        </button>
      )}
      {message && (
        <p role="alert" className="text-danger">
          {message}
        </p>
      )}
      <AddLinkForm category={tab} familyId={familyId} />
      {links.isError && !links.data && (
        <p role="alert" className="text-danger">
          {toVietnameseError(links.error)}
        </p>
      )}
    </main>
  );
}

function AddLinkForm({
  category,
  familyId,
}: {
  category: MusicCategory;
  familyId: string;
}) {
  const actions = useMusicActions(familyId);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const target = url.trim() === "" ? null : parseYouTubeUrl(url);
  // Spec §6.11: an invalid link is reported right at the input.
  const urlError =
    url.trim() !== "" && !target ? "Link YouTube không hợp lệ." : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsedTitle = parseLinkTitle(title);
    if (!target) {
      setError("Dán link YouTube của bài hát hoặc danh sách phát.");
      return;
    }
    if (parsedTitle === "too_long") {
      setError("Tên tối đa 80 ký tự.");
      return;
    }
    setError(null);
    actions.add.mutate(
      { category, title: parsedTitle, target },
      {
        onSuccess: () => {
          setUrl("");
          setTitle("");
        },
        onError: (e) => setError(toVietnameseError(e)),
      },
    );
  }

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <OnlineOnly>
      {/* noValidate: links without https:// are accepted (spec §6.11). */}
      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Thêm link YouTube</h2>
        <label className="flex flex-col gap-1">
          Link
          <input
            type="url"
            inputMode="url"
            className={input}
            placeholder="https://youtu.be/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {urlError && <span className="text-sm text-danger">{urlError}</span>}
        </label>
        <label className="flex flex-col gap-1">
          Tên (không bắt buộc)
          <input
            className={input}
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={actions.add.isPending}
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          Thêm vào {category === "relax" ? "Thư giãn" : "Phát triển trí não"}
        </button>
      </form>
    </OnlineOnly>
  );
}
