// CLEAN VERSION - 1 export default only
import { useState, useRef, useEffect } from "react";

const ACTIVITIES = ["Workshop nước hoa", "Workshop cắm hoa", "Cả 2", "Chưa xác định"];
const TIMESLOTS = ["14:00 - 16:00", "16:00 - 19:00"];
const BTC_CODES = { "6003450": "BTC-6003450", "6012470": "BTC-6012470", "6002197": "BTC-6002197" };
const BASE_URL = "https://lemaitranmedia.github.io/event-checkin";

function generateId() { return String(Math.floor(100000 + Math.random() * 900000)); }
function nowStr() { return new Date().toLocaleString("vi-VN", { hour12: false }); }

function useQRCode() {
  const [ready, setReady] = useState(!!window.QRCode);
  useEffect(() => {
    if (window.QRCode) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

function QRCodeBox({ value, size = 180 }) {
  const ref = useRef(null);
  const qrReady = useQRCode();
  useEffect(() => {
    if (!qrReady || !ref.current) return;
    ref.current.innerHTML = "";
    new window.QRCode(ref.current, {
      text: value, width: size, height: size,
      colorDark: "#000000", colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.M,
    });
  }, [qrReady, value, size]);
  return <div ref={ref} style={{ display: "inline-block", borderRadius: 8, overflow: "hidden" }} />;
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "0.5px solid #e8e8e8", fontSize: 14 }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{value}</span>
    </div>
  );
}

function TicketModal({ guest, onClose }) {
  const checkinUrl = `${BASE_URL}/?id=${guest.id}`;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 370, width: "94%", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#aaa", marginBottom: 4 }}>VÉ THAM DỰ SỰ KIỆN</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: "#1a1a2e" }}>{guest.name}</div>
          <div style={{ fontSize: 13, color: "#185FA5", marginTop: 2 }}>Mã KH: <b>#{guest.id}</b></div>
        </div>
        <div style={{ borderTop: "1px dashed #ddd", borderBottom: "1px dashed #ddd", padding: "10px 0", marginBottom: 14 }}>
          <Row label="Activity" value={guest.activity} />
          <Row label="Timeslot" value={guest.timeslot} />
          <Row label="Đăng ký" value={guest.registeredAt} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <QRCodeBox value={checkinUrl} size={180} />
          <div style={{ fontSize: 10, color: "#bbb", wordBreak: "break-all", textAlign: "center", padding: "0 8px" }}>{checkinUrl}</div>
        </div>
        <div style={{ fontSize: 11, color: "#ccc", textAlign: "center", marginBottom: 14 }}>Vé chỉ dành cho 1 người • Không chuyển nhượng</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()} style={{ flex: 1, padding: "10px 0", border: "1px solid #ddd", borderRadius: 8, background: "#f5f5f5", cursor: "pointer", fontSize: 14 }}>🖨️ In vé</button>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#185FA5", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

function CheckinScreen({ guestId, guests, onCheckin, onBack }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const guest = guests.find(g => g.id === guestId);

  if (!guest) return (
    <div style={{ textAlign: "center", padding: 48 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#a32d2d", marginBottom: 8 }}>Không tìm thấy vé</div>
      <div style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Mã KH <b>{guestId}</b> không tồn tại.</div>
      <button onClick={onBack} style={{ padding: "10px 28px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>← Quay lại</button>
    </div>
  );

  if (guest.checkedIn) return (
    <div style={{ textAlign: "center", padding: 48 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#BA7517", marginBottom: 8 }}>Vé đã được sử dụng</div>
      <div style={{ color: "#555", fontSize: 15, marginBottom: 4 }}><b>{guest.name}</b></div>
      <div style={{ color: "#aaa", fontSize: 13, marginBottom: 4 }}>Check-in lúc: {guest.checkedInAt}</div>
      <div style={{ color: "#aaa", fontSize: 13, marginBottom: 24 }}>Xác nhận bởi: <b>{guest.checkedInBy}</b></div>
      <button onClick={onBack} style={{ padding: "10px 28px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>← Quay lại</button>
    </div>
  );

  function handleConfirm() {
    const code = secret.trim();
    if (!BTC_CODES[code]) {
      setError("Mã bí mật không đúng. Vui lòng thử lại.");
      setShake(true); setTimeout(() => setShake(false), 500); return;
    }
    onCheckin(guest.id, BTC_CODES[code]);
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#aaa", marginBottom: 6 }}>XÁC NHẬN CHECK-IN</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1a2e" }}>{guest.name}</div>
        <div style={{ fontSize: 14, color: "#185FA5", marginTop: 4 }}>Mã KH: #{guest.id}</div>
      </div>
      <div style={{ background: "#f4f7fb", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <Row label="Activity" value={guest.activity} />
        <Row label="Timeslot" value={guest.timeslot} />
        <Row label="Đăng ký lúc" value={guest.registeredAt} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, fontSize: 14 }}>
          <span style={{ color: "#888" }}>Trạng thái</span>
          <span style={{ fontWeight: 700, color: "#3B6D11" }}>✅ Hợp lệ</span>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>🔐 Nhập mã BTC để xác nhận</label>
        <input type="password" value={secret}
          onChange={e => { setSecret(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleConfirm()}
          placeholder="Nhập mã xác nhận..."
          style={{ width: "100%", padding: "13px 14px", borderRadius: 10, fontSize: 16, boxSizing: "border-box", border: `2px solid ${error ? "#e24b4a" : "#dde4f0"}`, outline: "none" }}
          autoFocus />
        {error && <div style={{ color: "#a32d2d", fontSize: 13, marginTop: 6 }}>⚠️ {error}</div>}
      </div>
      <button onClick={handleConfirm} style={{ width: "100%", padding: "16px 0", background: "#3B6D11", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 800, fontSize: 18, marginBottom: 10 }}>✅ Xác nhận Check-in</button>
      <button onClick={onBack} style={{ width: "100%", padding: "10px 0", background: "none", border: "1px solid #ddd", borderRadius: 10, cursor: "pointer", color: "#888", fontSize: 14 }}>← Quay lại</button>
    </div>
  );
}

function CheckinSuccess({ guest, onBack }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 72, marginBottom: 12 }}>🎉</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0C447C", marginBottom: 10 }}>Check-in thành công!</div>
      <div style={{ fontSize: 17, color: "#185FA5", marginBottom: 4, fontWeight: 600 }}>{guest.name}</div>
      <div style={{ color: "#888", fontSize: 14, marginBottom: 4 }}>{guest.activity} · {guest.timeslot}</div>
      <div style={{ color: "#aaa", fontSize: 13, marginBottom: 4 }}>Ghi nhận lúc: {guest.checkedInAt}</div>
      <div style={{ color: "#aaa", fontSize: 13, marginBottom: 32 }}>Xác nhận bởi: <b>{guest.checkedInBy}</b></div>
      <button onClick={onBack} style={{ padding: "13px 36px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 15 }}>← Quay lại trang chủ</button>
    </div>
  );
}

export default function App() {
  const [guests, setGuests] = useState([]);
  const [tab, setTab] = useState("register");
  const [form, setForm] = useState({ name: "", activity: ACTIVITIES[0], timeslot: TIMESLOTS[0] });
  const [ticket, setTicket] = useState(null);
  const [search, setSearch] = useState("");
  const [checkinId, setCheckinId] = useState(null);
  const [checkinDone, setCheckinDone] = useState(null);
  const [manualId, setManualId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) { setCheckinId(id); setTab("checkin"); }
  }, []);

  function handleRegister() {
    if (!form.name.trim()) return;
    const g = { id: generateId(), name: form.name.trim(), activity: form.activity, timeslot: form.timeslot, registeredAt: nowStr(), checkedIn: false, checkedInAt: null, checkedInBy: null };
    setGuests(prev => [g, ...prev]);
    setTicket(g);
    setForm({ name: "", activity: ACTIVITIES[0], timeslot: TIMESLOTS[0] });
  }

  function handleCheckin(id, btcCode) {
    const updated = { ...guests.find(g => g.id === id), checkedIn: true, checkedInAt: nowStr(), checkedInBy: btcCode };
    setGuests(prev => prev.map(g => g.id === id ? updated : g));
    setCheckinDone(updated); setCheckinId(null);
    window.history.replaceState({}, "", window.location.pathname);
  }

  function handleBack() { setCheckinId(null); setCheckinDone(null); }

  function openCheckin(raw) {
    const id = raw.trim().replace(/.*[?&]id=/, "").split("&")[0];
    if (id) setCheckinId(id);
  }

  const filtered = guests.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.id.includes(search));
  const checkedInCount = guests.filter(g => g.checkedIn).length;

  if (checkinDone) return <div style={{ maxWidth: 480, margin: "0 auto", padding: 16, fontFamily: "sans-serif" }}><CheckinSuccess guest={checkinDone} onBack={handleBack} /></div>;
  if (checkinId) return <div style={{ maxWidth: 480, margin: "0 auto", padding: 16, fontFamily: "sans-serif" }}><CheckinScreen guestId={checkinId} guests={guests} onCheckin={handleCheckin} onBack={handleBack} /></div>;

  const tabs = [{ key: "register", label: "📝 Đăng ký" }, { key: "checkin", label: "📷 Check-in" }, { key: "list", label: `👥 DS (${guests.length})` }];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 12px", fontFamily: "sans-serif" }}>
      {ticket && <TicketModal guest={ticket} onClose={() => setTicket(null)} />}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>🎪 Hệ thống Check-in Sự kiện</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8, fontSize: 13 }}>
          <span>Đăng ký: <b style={{ color: "#185FA5" }}>{guests.length}</b></span>
          <span>Check-in: <b style={{ color: "#3B6D11" }}>{checkedInCount}</b></span>
          <span>Chưa đến: <b style={{ color: "#BA7517" }}>{guests.length - checkedInCount}</b></span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f0f0f0", borderRadius: 10, padding: 4 }}>
        {tabs.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "9px 4px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: tab === t.key ? 700 : 400, background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#185FA5" : "#555", fontSize: 13, boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>{t.label}</button>)}
      </div>
      {tab === "register" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "#555", fontWeight: 600, display: "block", marginBottom: 6 }}>Họ và tên *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}
              onKeyDown={e => e.key === "Enter" && handleRegister()} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#555", fontWeight: 600, display: "block", marginBottom: 6 }}>Loại Activity *</label>
            <select value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15, background: "#fff" }}>
              {ACTIVITIES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#555", fontWeight: 600, display: "block", marginBottom: 6 }}>Timeslot *</label>
            <select value={form.timeslot} onChange={e => setForm(f => ({ ...f, timeslot: e.target.value }))} style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15, background: "#fff" }}>
              {TIMESLOTS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={handleRegister} disabled={!form.name.trim()}
            style={{ padding: "13px 0", background: form.name.trim() ? "#185FA5" : "#c5d8ee", color: "#fff", border: "none", borderRadius: 10, cursor: form.name.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 16 }}>
            🎫 Tạo vé & In QR Code
          </button>
          <div style={{ background: "#f4f7fb", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#555", lineHeight: 1.8 }}>
            🔐 <b>Mã BTC:</b><br />
            {Object.keys(BTC_CODES).map(code => <span key={code} style={{ display: "inline-block", fontFamily: "monospace", fontSize: 13, color: "#185FA5", letterSpacing: 1, marginRight: 12 }}>{code}</span>)}<br />
            <span style={{ color: "#aaa" }}>Chỉ chia sẻ mã này với nhân viên BTC được phân công.</span>
          </div>
        </div>
      )}
      {tab === "checkin" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#f0f4fb", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#185FA5", marginBottom: 8 }}>🔗 Dán link hoặc mã KH trực tiếp</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={manualId} onChange={e => setManualId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && openCheckin(manualId)}
                placeholder="Dán link hoặc mã 6 số..."
                style={{ flex: 1, padding: "11px 14px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }} />
              <button onClick={() => openCheckin(manualId)} style={{ padding: "11px 18px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Mở →</button>
            </div>
          </div>
        </div>
      )}
      {tab === "list" && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm theo tên hoặc mã KH..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 14 }} />
          {filtered.length === 0 && <div style={{ color: "#999", textAlign: "center", padding: 32 }}>Chưa có khách hàng nào</div>}
          {filtered.map(g => (
            <div key={g.id} style={{ background: "#fff", border: `1px solid ${g.checkedIn ? "#97C459" : "#e0e0e0"}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{g.checkedIn ? "✅" : "⏳"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>#{g.id} · {g.activity} · {g.timeslot}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{g.checkedIn ? `Check-in: ${g.checkedInAt} — ${g.checkedInBy}` : `Đăng ký: ${g.registeredAt}`}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <button onClick={() => setTicket(g)} style={{ padding: "5px 10px", border: "1px solid #ddd", borderRadius: 6, background: "#f5f5f5", cursor: "pointer", fontSize: 12 }}>🎫 Vé</button>
                {!g.checkedIn && <button onClick={() => setCheckinId(g.id)} style={{ padding: "5px 10px", border: "none", borderRadius: 6, background: "#185FA5", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Check-in</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
