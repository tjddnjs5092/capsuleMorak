"use client";

import { useEffect, useState } from "react";

const GRADE_LABEL: Record<string, string> = { COMMON: "일반", RARE: "레어", SUPER_RARE: "슈퍼레어" };

type Item = { id: string; name: string; grade: string; imageUrl: string | null; probability: number; price: number; stock: number };

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("COMMON");
  const [probability, setProbability] = useState("0.1");
  const [price, setPrice] = useState("100");
  const [stock, setStock] = useState("100");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/items");
    setItems(await res.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function addItem() {
    setError(null);
    const res = await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        grade,
        imageUrl,
        probability: Number(probability),
        price: Number(price),
        stock: Number(stock)
      })
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "추가에 실패했어요.");
      return;
    }
    setName("");
    setImageUrl(null);
    await refresh();
  }

  return (
    <main className="flex-1 p-4 flex flex-col gap-5">
      <h1 className="font-display text-lg">아이템 관리</h1>

      <div className="flex flex-col gap-3 rounded-2xl bg-panel border border-panel-line p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-[#1d1438] border border-dashed border-panel-line flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              "🖼️"
            )}
          </div>
          <label className="text-sm text-text-dim rounded-lg border border-panel-line px-3 py-2 cursor-pointer">
            이미지 선택
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="아이템 이름"
          className="rounded-lg bg-[#1d1438] border border-panel-line px-3 py-2 text-sm"
        />
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="rounded-lg bg-[#1d1438] border border-panel-line px-3 py-2 text-sm"
        >
          <option value="COMMON">일반</option>
          <option value="RARE">레어</option>
          <option value="SUPER_RARE">슈퍼레어</option>
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            placeholder="확률 (0~1)"
            className="rounded-lg bg-[#1d1438] border border-panel-line px-2 py-2 text-xs"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="가격"
            className="rounded-lg bg-[#1d1438] border border-panel-line px-2 py-2 text-xs"
          />
          <input
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="재고"
            className="rounded-lg bg-[#1d1438] border border-panel-line px-2 py-2 text-xs"
          />
        </div>
        {error && <p className="text-sm text-pink">{error}</p>}
        <button
          onClick={addItem}
          className="font-display rounded-xl bg-gold text-[#2a1600] py-2.5 shadow-[0_5px_0_#b9740f]"
        >
          + 아이템 풀에 추가
        </button>
      </div>

      <div className="text-sm text-text-dim">등록된 아이템 {items.length}개</div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl bg-panel border border-panel-line p-2.5">
            <div className="w-11 h-11 rounded-lg bg-[#1d1438] overflow-hidden flex-shrink-0">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm truncate">{item.name}</div>
              <div className="text-xs text-text-dim">{GRADE_LABEL[item.grade]}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
