# NoteIT AI: Transforming Academic Learning with Intelligent Workspaces

## 🚀 Project Vision
NoteIT AI is a next-generation academic learning workspace designed to bridge the gap between raw educational content and deep conceptual mastery. By leveraging advanced AI, it transforms lectures, documents, and web resources into structured, personalized study materials, while providing educators with real-time diagnostic insights.

---

## 💡 The Problem
Students today are overwhelmed by information but underserved by structured learning tools.
- **Information Overload:** Lectures, PDFs, and videos are often passive and unorganized.
- **One-Size-Fits-All:** Learning materials don't adapt to individual student needs.
- **Feedback Gap:** Faculty lack granular visibility into where students are struggling until it's too late (exams).
- **Accessibility:** Academic language can be intimidating and difficult to grasp.

---

## ✨ The Solution: NoteIT AI
An integrated ecosystem consisting of a **Student Knowledge Studio** and a **Faculty Command Center**.

### 🎓 Student Workspace
- **Multi-Source Ingestion:** Seamlessly import PDFs, DOCX, PPTX, YouTube transcripts, and even live audio recordings.
- **AI-Powered Synthesis:** Generate high-quality notes, summaries, flashcards, and interactive mind maps in seconds.
- **Adaptive Practice:** Quizzes and revision tools that evolve based on student performance.
- **Research Hub:** Source-grounded AI chat for deep academic exploration without "hallucinations."
- **Bhai Lang:** A unique feature that explains complex topics in friendly "Hinglish," making learning more relatable.
- **Engagement:** Gamified experience with streaks, XP, and weekend challenges to build consistent study habits.

### 👩🏫 Faculty Workspace
- **Cohort Score Matrix:** A bird's-eye view of class-wide mastery across all subjects and topics.
- **Weak Topic Diagnostic:** AI identifies exactly where the class is struggling, linking weaknesses to specific student doubts.
- **Real-time Doubt Management:** Directly respond to student queries tied to specific lectures or concepts.
- **Learning Analytics:** Data-driven insights to help faculty tailor their teaching strategies.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, Vite, Tailwind CSS 4, Motion (Animations), Lucide React.
- **Backend:** Node.js, Express, TypeScript (tsx).
- **Database & Auth:** Firebase Authentication, Cloud Firestore.
- **Mobile:** Capacitor (Native Android support).
- **AI Engine:**
    - **Model Agnostic:** Supports multiple AI providers (Gemini, etc.) via **BYOK (Bring Your Own Key)**.
    - **Security:** Keys are encrypted with **AES-256-GCM** and stored in a server-side vault.
- **Parsing & Extraction:** `pdf-parse`, `mammoth`, `officeparser`, `cheerio`, `youtube-transcript`.
- **Infrastructure:** Render (API), Vercel (Web), Firebase Cloud Messaging.

---

## 🧠 Educational Innovation: The Bloom Engine
Unlike basic note-takers, NoteIT AI uses an internal **Bloom's Taxonomy Engine** to map student mastery across six cognitive levels:
1. **Remember:** Recalling facts and basic concepts.
2. **Understand:** Explaining ideas or concepts.
3. **Apply:** Using information in new situations.
4. **Analyze:** Drawing connections among ideas.
5. **Evaluate:** Justifying a stand or decision.
6. **Create:** Producing new or original work.

The system analyzes quiz telemetry to build a **Bloom Profile** for each student, highlighting dominant weaknesses and recommending targeted focus areas.

---

## 🔄 Main Workflow
1. **Onboarding:** Secure sign-in and AI provider setup (BYOK).
2. **Capture:** Student records a lecture or uploads a document.
3. **Process:** API extracts text/audio and normalizes it into a canonical format.
4. **Synthesize:** AI generates structured learning assets (Notes, Quizzes, Cards).
5. **Learn:** Student studies in the **Knowledge Studio** and practices via **Practice Blitz**.
6. **Analyze:** Faculty reviews the **Cohort Diagnostic** and addresses doubts.

---

## 🛡️ Security & Scalability
- **Privacy-First:** User-provided AI keys never touch browser storage.
- **Rate Limiting:** Sophisticated per-user daily quotas and per-minute limits protect resources.
- **Canonicalization:** Ensures consistent subject and topic identification across the entire platform.
- **Production Ready:** Designed for deployment on Render and Vercel with robust error sanitization and health monitoring.

---

## 🚀 Future Roadmap
- **Institutional Integration:** Direct LMS (Canvas/Moodle) sync.
- **Peer Learning:** Collaborative study rooms and peer-to-peer doubt resolution.
- **Offline Mode:** Enhanced mobile caching for learning without internet.
- **Advanced Whiteboard:** AI-assisted diagramming and mathematical proofs.

---

**NoteIT AI** – *Not just taking notes, but making sense of them.*
