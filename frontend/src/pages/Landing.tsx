import { Link } from 'react-router-dom';

const FAQS = [
  {
    q: 'How is PaathShala powered?',
    a: 'Two real providers. Gemini in the cloud is the default, and any models you have installed in Ollama are available locally. Auto mode answers from Gemini and falls back to a local model when the cloud is unreachable.',
  },
  {
    q: 'What are the structured answers?',
    a: 'When a question maps to one of 10 types — architecture, concept, code, comparison, learning, system design, tutorial, research, roadmap or debugging — the tutor opens with a compact JSON envelope and renders it as a visual card: diagram, concepts, steps, difficulty and next topics, followed by the full markdown explanation.',
  },
  {
    q: 'Is my data private?',
    a: 'To be direct: your account, chat history, memories and uploaded documents are stored on the server (PostgreSQL with pgvector) and scoped to your account. For answers generated entirely on your machine, choose Ollama — but cloud Gemini is the default.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes. Register with an email or username to use the AI Tutor, Dashboard and Planner. Sessions are secured with JWT and your data is scoped to your account.',
  },
  {
    q: 'Does it cost anything?',
    a: 'The product has no billing. You bring your own Gemini API key for cloud answers; Ollama runs free on your machine. Either provider works on its own.',
  },
  {
    q: 'Can I use my own documents?',
    a: 'Yes. Upload a PDF, TXT or Markdown file and the tutor grounds its answers in your material using retrieval-augmented generation — embeddings, vector search, then a grounded answer.',
  },
];

export default function Landing() {
  return (
    <div className="bg-background font-body-md text-on-background min-h-screen overflow-x-hidden antialiased">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b-2 border-surface-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="h-20 w-full px-margin-desktop flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary border-2 border-surface-border flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary">neurology</span>
              </div>
              <span className="font-headline-lg text-headline-lg tracking-tighter text-on-surface">
                PaathShala <span className="text-primary">AI</span>
              </span>
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#answers" className="transition-colors text-primary font-bold">Answers</a>
              <a href="#agents" className="font-button-text text-button-text text-on-surface-variant hover:text-primary transition-colors">Agents</a>
              <a href="#documents" className="font-button-text text-button-text text-on-surface-variant hover:text-primary transition-colors">Documents</a>
              <a href="#routing" className="font-button-text text-button-text text-on-surface-variant hover:text-primary transition-colors">Routing</a>
              <a href="#faq" className="font-button-text text-button-text text-on-surface-variant hover:text-primary transition-colors">FAQ</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-6 py-2 font-button-text text-button-text text-on-surface hover:bg-surface-container-high transition-all">
              Sign In
            </Link>
            <Link
              to="/ai-tutor"
              className="px-6 py-3 bg-secondary text-on-secondary border-2 border-surface-border font-button-text text-button-text shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
            >
              Start Learning
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-20 bg-background">
        <div className="flex flex-col w-full">
          {/* Hero Section */}
          <section className="w-full bg-background pt-24 pb-section-gap px-margin-mobile md:px-margin-desktop relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div className="absolute top-10 left-10 w-24 h-24 bg-primary-fixed rounded-full opacity-50 blur-2xl"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-secondary-fixed rounded-full opacity-50 blur-2xl"></div>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg font-black text-on-surface max-w-4xl mx-auto mb-6 relative z-10 leading-tight">
              <span className="block text-primary tracking-tight">Ask anything. Get an answer</span>
              <span className="inline-block bg-secondary text-on-secondary-fixed px-4 py-2 mt-2 border-4 border-surface-border transform -rotate-2 tracking-tight">built like a lesson.</span>
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-12 relative z-10">
              PaathShala streams answers from Gemini or your local Ollama models and renders them as presentations — architecture diagrams, code walkthroughs, comparisons and learning roadmaps — grounded in your documents and long-term memory.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
              <Link to="/ai-tutor" className="px-8 py-4 bg-secondary text-on-secondary-fixed border-2 border-surface-border font-button-text text-button-text shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all w-full sm:w-auto text-lg">
                Start Chatting with AI →
              </Link>
              <a href="#answers" className="px-8 py-4 bg-surface-container-lowest text-on-surface border-2 border-surface-border font-button-text text-button-text shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all w-full sm:w-auto text-lg">
                See structured answers
              </a>
            </div>
          </section>

          {/* Key Features (Four Steps) mapped to RAG/Memory */}
          <section id="documents" className="w-full bg-surface-container-low py-section-gap px-margin-mobile md:px-margin-desktop border-t-4 border-surface-border">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20 flex flex-col items-center">
                <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase mb-4 block">Grounding & Memory</span>
                <h2 className="font-display-lg text-[48px] md:text-[64px] leading-none font-black text-on-surface uppercase mb-4 tracking-tight">
                  FOUR STEPS.
                </h2>
                <div className="inline-block bg-secondary-fixed text-on-secondary-fixed px-8 py-3 border-4 border-surface-border transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <span className="font-display-lg text-[36px] md:text-[48px] leading-none font-black uppercase tracking-tight">NO TRAINING REQUIRED.</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-1 bg-surface-border z-0"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-24 h-24 bg-surface-container-lowest border-4 border-surface-border flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-2 transition-transform duration-300 relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary border-2 border-surface-border rounded-full flex items-center justify-center font-button-text text-on-secondary-fixed">1</div>
                    <span className="material-symbols-outlined text-[40px] text-primary">upload_file</span>
                  </div>
                  <h3 className="font-headline-lg text-2xl text-on-surface mb-2">Upload</h3>
                  <p className="font-body-md text-on-surface-variant">Bring your own material (PDF, TXT, MD). We support it all.</p>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center group lg:mt-12">
                  <div className="w-24 h-24 bg-surface-container-lowest border-4 border-surface-border flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-2 transition-transform duration-300 relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary border-2 border-surface-border rounded-full flex items-center justify-center font-button-text text-on-secondary-fixed">2</div>
                    <span className="material-symbols-outlined text-[40px] text-primary">content_cut</span>
                  </div>
                  <h3 className="font-headline-lg text-2xl text-on-surface mb-2">Chunk</h3>
                  <p className="font-body-md text-on-surface-variant">We intelligently split your documents into retrievable pieces.</p>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-24 h-24 bg-surface-container-lowest border-4 border-surface-border flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-2 transition-transform duration-300 relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary border-2 border-surface-border rounded-full flex items-center justify-center font-button-text text-on-secondary-fixed">3</div>
                    <span className="material-symbols-outlined text-[40px] text-primary">memory</span>
                  </div>
                  <h3 className="font-headline-lg text-2xl text-on-surface mb-2">Embed</h3>
                  <p className="font-body-md text-on-surface-variant">Powered by Gemini embeddings mapped to pgvector.</p>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center group lg:mt-12">
                  <div className="w-24 h-24 bg-surface-container-lowest border-4 border-surface-border flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-2 transition-transform duration-300 relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary border-2 border-surface-border rounded-full flex items-center justify-center font-button-text text-on-secondary-fixed">4</div>
                    <span className="material-symbols-outlined text-[40px] text-primary">verified</span>
                  </div>
                  <h3 className="font-headline-lg text-2xl text-on-surface mb-2">Grounded Answer</h3>
                  <p className="font-body-md text-on-surface-variant">Top chunks injected directly into the prompt for perfect context.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Agents Section */}
          <section id="agents" className="w-full bg-surface py-section-gap px-margin-mobile md:px-margin-desktop border-t-4 border-surface-border">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase mb-4 block">Multi-agent planner</span>
                <h2 className="font-headline-xl text-headline-xl text-on-surface">
                  INTELLIGENT AGENTS. <br />
                  <span className="bg-primary text-on-primary px-4 py-1 inline-block mt-2 transform rotate-1">WORKING FOR YOU.</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-surface-container-lowest border-4 border-surface-border p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                  <div className="w-16 h-16 bg-secondary border-2 border-surface-border mb-6 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-on-secondary-fixed">account_tree</span>
                  </div>
                  <h3 className="font-headline-lg text-2xl text-on-surface mb-4 uppercase">Supervisor Agent</h3>
                  <p className="font-body-md text-on-surface-variant mb-6">LangGraph · classifies each message → dispatches to a specialist agent — no prompt-engineering required.</p>
                  <div className="w-full h-48 bg-surface-container-high border-2 border-surface-border flex items-center justify-center overflow-hidden">
                    <img alt="Supervisor Agent Architecture" className="w-full h-full object-cover mix-blend-multiply opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr7mYMzD5zYgjdMYicpCe3qZTyKaZ4cBrEH_jXoJIyyorcvJFcK1o04SxXsgtEgEiOkU58Ymg96PZy70Xp87P5BEigaBorxTBUnS7FPeC88EOf7myFKflKQBbSZ8C-_g5TlT3FK8FbIJp4zA84bd95xOcFflJTdO4rTC8JsKqQabXS1kMJiim7dJfp46AF09SBms1YfmXJHHpcMLV40WqCuhigbcab_tK79P6T6br0npZOQfCuTVLt4P7geeEHKqdDSw" />
                  </div>
                </div>

                <div className="bg-primary-fixed border-4 border-surface-border p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                  <div className="w-16 h-16 bg-surface-container-lowest border-2 border-surface-border mb-6 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-primary">menu_book</span>
                  </div>
                  <h3 className="font-headline-lg text-2xl text-on-primary-fixed mb-4 uppercase">Tutor Agent</h3>
                  <p className="font-body-md text-on-primary-fixed-variant mb-6">The everyday teacher — grounded in your documents and memory. Answers 10 types of structured lessons.</p>
                  <div className="w-full h-48 bg-surface-container-lowest border-2 border-surface-border flex items-center justify-center overflow-hidden">
                    <img alt="Tutor Agent" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnIb383JE25drMKzwXidzBKTz3IbFImzFdwicau6ks5w6ZHOOY5PjoMupCJsgCQbmfVrPsnfKTEztcFxXENOwEKNIL918gtYdgvZrb2FXEdNoEijkRJntZla4HcFzYu8Cbs_hE1GjI42KXLP7rIVtrSzHz-qhc3FgGugN_zb27Nc-4y7vV2bSrfGDK0eKIrWUW7DqiLkEmtWihCzo5kXrzoD9SSkNfF_pCu1Stvrd0PSQJDO_sILAT" />
                  </div>
                </div>

                <div className="bg-tertiary-fixed border-4 border-surface-border p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                  <div className="w-16 h-16 bg-surface-container-lowest border-2 border-surface-border mb-6 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-tertiary">map</span>
                  </div>
                  <h3 className="font-headline-lg text-2xl text-on-tertiary-fixed mb-4 uppercase">Planner Agent</h3>
                  <p className="font-body-md text-on-tertiary-fixed-variant mb-6">Turns “learn X” into a week-by-week roadmap. Keeps you on track and maps out your curriculum.</p>
                  <div className="w-full h-48 bg-surface-container-lowest border-2 border-surface-border flex items-center justify-center overflow-hidden">
                    <img alt="Planner Agent" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfcpZ95-Wx2kHeORBQ76AF4wmEbkyIlVA08F0GK55jzGt77UoYXNAZBwBPpod0_wA2KTBwK-fE5Y_k6dTeoU2Kwj7wgU-WA_2b1RVBznztjrwArAWmxEJeJzPbWk9zwImu2rrXkQkUBSvmBtW5gAPcR-XuDb1T2LSfy0Emxa53zekN3fCeC-LsF6FckoVcggOe_Ml_pKUw73BmBOafA2j--w9mCz6UTzR56qLtPPNz7pwT6ty0adcJ" />
                  </div>
                </div>

                <div className="bg-secondary-fixed border-4 border-surface-border p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                  <div className="w-16 h-16 bg-surface-container-lowest border-2 border-surface-border mb-6 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-on-secondary-fixed">quiz</span>
                  </div>
                  <h3 className="font-headline-lg text-2xl text-on-secondary-fixed mb-4 uppercase">Quiz Agent</h3>
                  <p className="font-body-md text-on-secondary-fixed-variant mb-6">Tests your knowledge. Automatically generates practice questions from any topic you have covered.</p>
                  <div className="w-full h-48 bg-surface-container-lowest border-2 border-surface-border flex items-center justify-center overflow-hidden">
                    <img alt="Quiz Agent" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx3aX2EJNv0JV2F3QI4StTakexPjszNnNjECKjAWLrMt0e_OEuZ1WMoI8QpFBHCEqKlCPjtgFXz3kYnY5WuFwE6IqsQvmTcU_HPHqaG7J5UoTnHl23YxqLpicjLw9wn_zgHQKZ0tVKE99tQTQ3qAdTj08EW4iMhQiK-NJGGidUQE_gitW6mGHosBD5W-Xuo2JOTn9xI3Rj7HjXx1K_jMI2mnY_Dp2Gubrw54M-f9gy2l1KtZMmxrgK" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Technical / Comparison Section */}
          <section id="routing" className="w-full bg-primary py-section-gap px-margin-mobile md:px-margin-desktop border-t-4 border-surface-border text-on-primary">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-headline-xl text-headline-xl mb-4">
                  ROUTING YOU CAN <span className="text-secondary-fixed bg-surface-border px-2">SEE AND CONTROL.</span>
                </h2>
                <p className="font-body-lg max-w-2xl mx-auto text-on-primary-container">Auto mode answers from Gemini and falls back to a local model when unreachable.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                <div className="bg-surface-container-lowest text-on-surface border-4 border-surface-border p-8 relative">
                  <div className="absolute -top-5 left-8 bg-error text-on-error font-label-caps px-4 py-1 border-2 border-surface-border transform -rotate-2">THE OLD WAY</div>
                  <ul className="space-y-6 mt-6">
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-error-container border-2 border-surface-border flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="material-symbols-outlined text-error text-[16px]">close</span>
                      </div>
                      <div>
                        <p className="font-button-text">Black Box AI</p>
                        <p className="font-body-md text-on-surface-variant">You have no idea how the model arrived at its answer.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-error-container border-2 border-surface-border flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="material-symbols-outlined text-error text-[16px]">close</span>
                      </div>
                      <div>
                        <p className="font-button-text">Hallucinations</p>
                        <p className="font-body-md text-on-surface-variant">Models make things up when they don't know the answer.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-error-container border-2 border-surface-border flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="material-symbols-outlined text-error text-[16px]">close</span>
                      </div>
                      <div>
                        <p className="font-button-text">Amnesia</p>
                        <p className="font-body-md text-on-surface-variant">Starting from scratch every single session.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-secondary-fixed text-on-secondary-fixed border-4 border-surface-border p-8 relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform md:-translate-y-4">
                  <div className="absolute -top-5 left-8 bg-primary text-on-primary font-label-caps px-4 py-1 border-2 border-surface-border transform rotate-2">THE PAATHSHALA WAY</div>
                  <ul className="space-y-6 mt-6">
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary border-2 border-surface-border flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="material-symbols-outlined text-on-primary text-[16px]">check</span>
                      </div>
                      <div>
                        <p className="font-button-text">Transparent Routing</p>
                        <p className="font-body-md opacity-90">See exactly which agent and chunks were used for the answer.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary border-2 border-surface-border flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="material-symbols-outlined text-on-primary text-[16px]">check</span>
                      </div>
                      <div>
                        <p className="font-button-text">Grounded Context</p>
                        <p className="font-body-md opacity-90">Answers strictly derived from your uploaded documents via pgvector.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary border-2 border-surface-border flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="material-symbols-outlined text-on-primary text-[16px]">check</span>
                      </div>
                      <div>
                        <p className="font-button-text">Compounding Memory</p>
                        <p className="font-body-md opacity-90">The tutor learns your progress and recalls past conversations.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="w-full bg-surface-container py-section-gap px-margin-mobile md:px-margin-desktop border-t-4 border-surface-border">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-headline-xl text-headline-xl text-on-surface">
                  FREQUENTLY ASKED. <br /> <span className="bg-surface-container-highest inline-block px-4 border-2 border-surface-border mt-2">CLEARLY ANSWERED.</span>
                </h2>
              </div>
              <div className="space-y-4">
                {FAQS.map((faq, index) => (
                  <details key={index} className="group bg-surface-container-lowest border-4 border-surface-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] open:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <summary className="flex justify-between items-center font-headline-lg text-xl p-6 cursor-pointer list-none">
                      <span>{faq.q}</span>
                      <span className="transition group-open:rotate-180">
                        <span className="material-symbols-outlined">expand_more</span>
                      </span>
                    </summary>
                    <div className="text-on-surface-variant font-body-lg p-6 pt-0 border-t-2 border-surface-border mt-2">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="w-full bg-primary py-32 px-margin-mobile md:px-margin-desktop border-t-4 border-surface-border text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            <div className="max-w-3xl mx-auto relative z-10">
              <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg font-black text-on-primary mb-8 leading-tight tracking-tight">
                Learn with a tutor that explains. <br />
                <span className="text-secondary-fixed">Free to use.</span>
              </h2>
              <Link to="/register" className="inline-block px-10 py-5 bg-secondary text-on-secondary-fixed border-4 border-surface-border font-button-text text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all uppercase tracking-wider">
                Start Your Journey
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full bg-surface-container border-t-2 border-surface-border mt-section-gap pb-20 pt-16">
        <div className="w-full px-margin-desktop grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-gutter">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary border-2 border-surface-border flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">neurology</span>
              </div>
              <span className="font-headline-lg text-[24px] tracking-tighter text-on-surface">PaathShala AI</span>
            </div>
            <p className="font-body-md text-on-surface-variant mb-8 max-w-xs">The neo-brutalist engine for structured educational intelligence.</p>
          </div>
          <div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6">Product</h4>
            <ul className="space-y-4">
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">How It Works</li>
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">Who Uses It</li>
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">Pricing</li>
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6">Examples</h4>
            <ul className="space-y-4">
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">For Students</li>
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">For Teachers</li>
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">For Schools</li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">Support</li>
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">Sales</li>
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">Partners</li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6">Legal</h4>
            <ul className="space-y-4">
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">Trust</li>
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">Compliance</li>
              <li className="font-body-md text-on-surface hover:text-primary cursor-pointer">Privacy</li>
            </ul>
          </div>
        </div>
        <div className="w-full px-margin-desktop mt-20 pt-8 border-t border-outline-variant flex justify-between items-center">
          <span className="font-body-md text-on-surface-variant">© 2024 PaathShala AI Inc.</span>
        </div>
      </footer>
    </div>
  );
}
