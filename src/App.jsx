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
          style={{ width: "100%", padding: "13px 14px", borderRadius: 10, fontSize: 16, boxSizing: "border-box", border: `2px solid ${error ? "#e24b4a" : "#dde4f0"}`, outline: "none", animation: shake ? "shake 0.4s" : "none" }}
          autoFocus />
        {error && <div style={{ color: "#a32d2d", fontSize: 13, marginTop: 6 }}>⚠️ {error}</div>}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
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

