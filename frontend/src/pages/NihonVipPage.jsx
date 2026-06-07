import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { learningApi } from "../api/learningApi.js";
import LoginRequiredModal from "../components/LoginRequiredModal.jsx";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const benefits = [
  "Chatbot AI VIP hỗ trợ hỏi đáp tiếng Nhật, JLPT, dịch câu, sửa ngữ pháp và cách dùng NihonPath",
  "Mở khóa toàn bộ đề thi JLPT VIP để luyện thi không giới hạn trong thời gian gói còn hiệu lực",
];

const quickPrompts = [
  "Giải thích giúp mình khác nhau giữa は và が",
  "Lập lịch ôn N5 trong 7 ngày",
  "Hướng dẫn mình dùng flashcard trên NihonPath",
  "Mình nên học gì tiếp theo sau ngữ pháp N5?",
];

const initialMessages = [
  {
    role: "assistant",
    content:
      "Chào bạn, mình là AI VIP của NihonPath. Mình có thể hỗ trợ học tiếng Nhật, JLPT, flashcard, làm bài tập, dịch câu, tra từ vựng và cách sử dụng website này.",
  },
];

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value ?? 0)}đ`;
const dateText = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "Chưa có");
const isVipActive = (status) => Boolean(status?.vipActive) || (status?.vipExpiresAt && new Date(status.vipExpiresAt).getTime() > Date.now());

export default function NihonVipPage({ mode = "promo" }) {
  const isAiMode = mode === "ai";
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [vipStatus, setVipStatus] = useState(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const vipActive = isVipActive(vipStatus);

  useEffect(() => {
    if (!isAiMode && isAuthenticated) {
      learningApi.getVipStatus().then(setVipStatus).catch(() => setVipStatus(null));
    } else if (!isAuthenticated) {
      setVipStatus(null);
    }
  }, [isAiMode, isAuthenticated]);

  const paymentNotice = useMemo(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      if (vipActive) return "Thanh toán thành công. VIP của bạn đã được kích hoạt.";
      if (vipStatus) return "Thanh toán chưa được xác nhận hoặc đã bị hủy.";
      return "Đang kiểm tra trạng thái thanh toán...";
    }
    if (payment === "failed") return "Thanh toán chưa thành công hoặc đã bị hủy.";
    return "";
  }, [searchParams, vipActive, vipStatus]);

  const apiHistory = useMemo(
    () =>
      messages
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-8)
        .map(({ role, content }) => ({ role, content })),
    [messages]
  );

  const createPayment = async () => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    if (vipActive) {
      return;
    }
    setPaying(true);
    setStatus("");
    try {
      const response = await learningApi.createVipPayment({});
      window.location.href = response.payUrl;
    } catch (err) {
      setStatus(err.message);
    } finally {
      setPaying(false);
    }
  };

  const sendMessage = async (event, prompt = null) => {
    event?.preventDefault();
    const content = (prompt ?? message).trim();
    if ((!content && files.length === 0) || sending) return;

    const attachedFiles = prompt ? [] : files;
    const nextMessages = [
      ...messages,
      {
        role: "user",
        content: content || "Đọc tài liệu/ảnh đính kèm giúp mình.",
        files: attachedFiles.map((file) => file.name),
      },
    ];
    setMessages(nextMessages);
    setMessage("");
    setFiles([]);
    setStatus("");
    setSending(true);

    try {
      const response = await learningApi.sendVipAiMessage({
        message: content,
        history: apiHistory,
        files: attachedFiles,
      });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer || "Mình chưa có câu trả lời phù hợp cho câu hỏi này.",
        },
      ]);
    } catch (err) {
      const errorMessage = err.message || "Mình chưa kết nối được AI lúc này. Bạn thử lại sau nhé.";
      setStatus(errorMessage);
      setMessages((current) => [...current, { role: "assistant", content: errorMessage }]);
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files ?? []).slice(0, 4);
    setFiles(selected);
    event.target.value = "";
  };

  return (
    <StudyShell active="AI VIP" title={isAiMode ? "AI VIP" : "Quyền lợi VIP"}>
      <main className="study-main vip-main">
        <section className="detail-hero vip-hero">
          <div>
            <span className="vocab-detail-level">NihonPath VIP</span>
            <h1>{isAiMode ? "Chatbot AI cho người dùng VIP" : "VIP mở Chatbot và đề thi JLPT."}</h1>
            <p>
              {isAiMode
                ? "Hỏi về tiếng Nhật, JLPT, flashcard, bài học, bài tập, dịch câu, tra từ vựng và cách sử dụng NihonPath."
                : "Nâng cấp VIP 30 ngày qua VNPAY để dùng Chatbot AI và mở khóa toàn bộ đề thi JLPT VIP."}
            </p>
          </div>
        </section>

        {isAiMode ? (
          <section className="vip-chat-layout">
            <div className="vip-chat-panel">
              <div className="vip-chat-messages" aria-live="polite">
                {messages.map((item, index) => (
                  <article className={`vip-chat-bubble ${item.role}`} key={`${item.role}-${index}`}>
                    <span>{item.role === "user" ? "Bạn" : "AI VIP"}</span>
                    <p>{item.content}</p>
                    {item.files?.length ? (
                      <div className="vip-chat-attachments">
                        {item.files.map((file) => (
                          <small key={file}>{file}</small>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
                {sending ? (
                  <article className="vip-chat-bubble assistant">
                    <span>AI VIP</span>
                    <p>Đang suy nghĩ...</p>
                  </article>
                ) : null}
              </div>

              <form className="vip-chat-form" onSubmit={sendMessage}>
                <div className="vip-chat-input-stack">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Nhập câu hỏi, hoặc đính kèm ảnh/tài liệu để AI đọc..."
                    rows={3}
                    maxLength={1200}
                  />
                  <div className="vip-file-row">
                    <label>
                      Đính kèm
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.txt,.md,.csv,.tsv,.docx,.xlsx,.xls,.json,.xml,.html,.htm,.srt"
                        onChange={handleFileChange}
                        disabled={sending}
                      />
                    </label>
                    {files.length ? (
                      <div className="vip-file-list">
                        {files.map((file) => (
                          <span key={`${file.name}-${file.size}`}>{file.name}</span>
                        ))}
                      </div>
                    ) : (
                      <small>Hỗ trợ ảnh, PDF, Word, Excel, TXT, CSV, TSV, MD, JSON, XML, HTML, SRT. Tối đa 4 tệp.</small>
                    )}
                  </div>
                </div>
                <button type="submit" disabled={sending || (!message.trim() && files.length === 0)}>
                  Gửi
                </button>
              </form>
              {status ? <small className="study-note">{status}</small> : null}
            </div>

            <aside className="vip-chat-side">
              <h2>Gợi ý nhanh</h2>
              <div className="vip-prompt-list">
                {quickPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={(event) => sendMessage(event, prompt)} disabled={sending}>
                    {prompt}
                  </button>
                ))}
              </div>
              <p>Chatbot hỗ trợ học tiếng Nhật: làm bài tập, dịch câu, tra từ vựng, sửa ngữ pháp, luyện JLPT và hướng dẫn dùng NihonPath.</p>
            </aside>
          </section>
        ) : (
          <section className="vip-grid">
            <article className="vip-price-card">
              <span>Gói học tập 30 ngày</span>
              <h2>
                {money(vipStatus?.priceVnd ?? 199000)} <small>/ 30 ngày</small>
              </h2>
              <p>
                {vipActive ? "VIP đang hiệu lực đến:" : "VIP chưa kích hoạt hoặc đã hết hạn:"}{" "}
                <strong>{dateText(vipStatus?.vipExpiresAt)}</strong>
              </p>
              {vipActive ? <Link to="/vip/ai">Vào AI Chatbot</Link> : null}
              {!vipActive ? <button type="button" onClick={createPayment} disabled={paying}>
                {paying ? "Đang tạo giao dịch..." : "Thanh toán VNPAY"}
              </button> : null}
              {paymentNotice ? <small className="study-note">{paymentNotice}</small> : null}
              {status ? <small className="study-note">{status}</small> : null}
            </article>
            <div className="vip-benefits">
              {benefits.map((benefit) => (
                <div key={benefit}>{benefit}</div>
              ))}
            </div>
          </section>
        )}
      </main>
      {loginPromptOpen ? (
        <LoginRequiredModal
          onClose={() => setLoginPromptOpen(false)}
          message="Bạn cần đăng nhập hoặc đăng ký tài khoản trước khi thanh toán VIP qua VNPAY."
        />
      ) : null}
    </StudyShell>
  );
}
