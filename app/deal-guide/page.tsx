import Link from 'next/link';

export const metadata = {
  title: 'Deal Guide — VibeSandbox',
  description: '판매자와 구매자가 연결된 후 확인해야 할 것들. 소유권 증명, 실사 체크리스트, 레드 플래그.',
};

const SELLER_CHECKLIST = [
  {
    title: '소유권 증명',
    color: 'var(--blue)',
    bg: 'var(--blue-light)',
    icon: '🔑',
    items: [
      { label: '도메인 메타태그', desc: '앱의 <head>에 접근 가능하다면 이게 가장 빠른 증명입니다. 구매자 요청 시 임시 메타태그를 심어줄 수 있어요.' },
      { label: 'App Store / Play Store 개발자명', desc: '스토어 페이지의 "Developer" 필드가 본인 이름 또는 회사명과 일치하는지 보여주세요.' },
      { label: 'GitHub 저장소', desc: '공개 repo라면 commit author 이메일이 연락 이메일과 같은지 확인 가능합니다. 비공개 repo는 구매자에게 collaborator 초대로 접근 허용.' },
      { label: 'Stripe / 결제 대시보드', desc: '수익이 있다면 Stripe 대시보드 스크린샷 (민감 정보 마스킹 후)으로 수익과 소유권을 동시에 증명할 수 있습니다.' },
    ],
  },
  {
    title: '준비해두면 좋은 정보',
    color: 'var(--green)',
    bg: 'var(--green-light)',
    icon: '📋',
    items: [
      { label: 'MAU / DAU', desc: '월간·일간 활성 사용자 수. Analytics 대시보드 스크린샷이면 충분합니다.' },
      { label: 'MRR / 누적 매출', desc: '월 반복 수익 또는 총 매출. 범위로 말해도 됩니다 ($1k–$3k/mo 등).' },
      { label: '월 운영 비용', desc: 'API 비용 + 호스팅. 구매자가 인수 후 손익을 계산하는 데 필수입니다.' },
      { label: '기술 스택', desc: '어떤 AI 모델, 프레임워크, DB를 쓰는지. 유지 난이도를 가늠하는 핵심 정보입니다.' },
      { label: '유지보수 부담', desc: '매달 얼마나 손이 가는지. "Set and forget" vs "매일 확인 필요" 중 어디인지 솔직하게.' },
      { label: '판매 이유', desc: '구매자가 가장 먼저 묻는 질문입니다. 미리 솔직하게 준비해두면 신뢰도가 올라갑니다.' },
    ],
  },
  {
    title: '거래에 포함되는 자산',
    color: 'var(--amber)',
    bg: 'var(--amber-light)',
    icon: '📦',
    items: [
      { label: '도메인', desc: '도메인 이전 여부와 레지스트라(Namecheap, GoDaddy 등)를 확인해두세요.' },
      { label: 'GitHub 저장소', desc: '소스코드 이전 방식 — 소유권 이전 vs 포크 vs zip 전달 중 무엇인지 합의.' },
      { label: '소셜 미디어 계정', desc: 'Twitter/X, LinkedIn 페이지 등 팔로워 자산. 개인 계정이면 이전 불가 가능성 있음.' },
      { label: '고객 데이터베이스', desc: 'GDPR/개인정보 이전 규정 확인 필수. 이메일 리스트 이전은 별도 동의가 필요할 수 있습니다.' },
      { label: '문서 / SOP', desc: '운영 가이드, 프롬프트 문서, API 키 목록 등. 인수 후 가장 필요한 자산입니다.' },
    ],
  },
];

const BUYER_CHECKLIST = [
  {
    q: '이 앱을 직접 만들었나요?',
    why: '가장 먼저 확인해야 할 것. 도메인 접근 권한, App Store 개발자명, GitHub repo commit으로 증명 가능합니다.',
  },
  {
    q: '실제 사용자가 있나요? 얼마나 활성적인가요?',
    why: 'MAU, 세션 수, 리텐션을 Analytics 화면으로 보여달라고 하세요. 가입자 수가 아닌 활성 사용자가 중요합니다.',
  },
  {
    q: '매출은 어떻게 발생하고 있나요?',
    why: 'MRR, 결제 수단, 이탈률(churn)을 확인하세요. "수익 없음"도 정직한 답이지만, 그렇다면 왜 사람들이 쓰는지 물어보세요.',
  },
  {
    q: '월 운영 비용이 얼마나 드나요?',
    why: 'AI API 비용은 사용량에 따라 급격히 증가할 수 있습니다. 현재 비용 구조와 사용자 증가 시 예상 비용을 같이 확인하세요.',
  },
  {
    q: '어떤 AI 모델에 의존하고 있나요?',
    why: '특정 모델에 deeply 묶여있다면 모델 deprecated 시 리스크가 생깁니다. Fine-tuning이 있다면 데이터 이전 가능한지 확인하세요.',
  },
  {
    q: '왜 파는 건가요?',
    why: '가장 중요한 질문 중 하나. 번아웃, 새 프로젝트 집중, 현금화 필요 — 이유가 납득되는지 판단하세요.',
  },
  {
    q: '핸드오버 계획이 있나요?',
    why: '2주 인수인계, 문서화 수준, 긴급 연락 가능 여부. 특히 기술 스택이 복잡할수록 이게 딜의 핵심입니다.',
  },
  {
    q: '법적으로 문제없는 앱인가요?',
    why: '제3자 API ToS 준수, 저작권, 개인정보처리방침 존재 여부. 특히 AI 앱은 데이터 사용 정책을 반드시 확인하세요.',
  },
];

const RED_FLAGS = [
  { flag: '소유권 증명을 거부하거나 계속 미룸', risk: 'HIGH' },
  { flag: 'Analytics 접근을 "나중에" 보여준다고 함', risk: 'HIGH' },
  { flag: '매출을 스크린샷 없이 구두로만 주장', risk: 'HIGH' },
  { flag: 'GitHub repo가 없거나 commit 기록이 며칠 이내로 짧음', risk: 'HIGH' },
  { flag: '운영 비용을 모른다고 함', risk: 'MED' },
  { flag: '고객 데이터가 없다고 하는데 MAU는 높다고 주장', risk: 'MED' },
  { flag: '문서가 전혀 없음 ("내 머릿속에 다 있다")', risk: 'MED' },
  { flag: '판매 이유가 계속 바뀌거나 모호함', risk: 'MED' },
  { flag: '가격을 먼저 제시하고 실사 자료를 나중에 준다고 함', risk: 'MED' },
];

const PROCESS_STEPS = [
  { n: '01', title: '첫 메시지', desc: 'VibeSandbox 릴레이로 구매자가 연락합니다. 판매자 이메일로 전달되며 구매자 이메일이 포함됩니다. 직접 답장하세요.' },
  { n: '02', title: '기본 확인', desc: '소유권 증명과 기본 지표(MAU, MRR, 운영비용)를 공유합니다. 이 단계에서 신뢰가 생겨야 다음으로 넘어갑니다.' },
  { n: '03', title: '실사(Due Diligence)', desc: '기술 스택, Analytics 접근, 코드 리뷰, 고객 데이터 범위, 법적 이슈를 확인합니다. 위에 있는 구매자 체크리스트를 활용하세요.' },
  { n: '04', title: '가격 협상', desc: "VibeSandbox는 가격에 관여하지 않습니다. SDE(Seller's Discretionary Earnings) 기준, 또는 MRR 배수(통상 12–36x)로 협상합니다." },
  { n: '05', title: '자산 이전', desc: '도메인, 코드, 계정, 문서를 순서대로 이전합니다. 입금 확인 후 이전하거나, Escrow 서비스(Escrow.com 등)를 활용하세요.' },
  { n: '06', title: '인수인계', desc: '2주 이상의 인수인계 기간을 권장합니다. 판매자가 질문에 응할 수 있는 기간을 계약에 명시하세요.' },
];

export default function DealGuidePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'oklch(0.985 0.004 80 / 0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/feed" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="VibeSandbox" style={{ height: 25, width: 'auto', display: 'block' }} />
          </Link>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>·</span>
          <Link href="/feed" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>← Back to feed</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 4, background: 'var(--accent)', border: '2px solid var(--ink)', boxShadow: '2px 2px 0px var(--ink)', marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>연결됐나요?</span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
            이제 뭘 확인해야 할까요
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text2)', lineHeight: 1.7 }}>
            VibeSandbox는 연결만 합니다 — 거래는 여러분이 직접 합니다.
            판매자와 구매자 양쪽이 확인해야 할 것들을 정리했습니다.
          </p>
        </div>

        {/* Process */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 28 }}>거래 절차</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {PROCESS_STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, marginBottom: i < PROCESS_STEPS.length - 1 ? 0 : 0 }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, background: 'var(--ink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: 'var(--accent)', fontFamily: "'DM Mono', monospace",
                  }}>{s.n}</div>
                  {i < PROCESS_STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 6, minHeight: 28 }} />
                  )}
                </div>
                <div style={{ paddingTop: 8, paddingBottom: i < PROCESS_STEPS.length - 1 ? 28 : 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seller section */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'var(--ink)', color: 'var(--accent)', fontFamily: "'DM Mono', monospace" }}>판매자</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>구매자가 물어볼 것들</h2>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 32 }}>
            구매자는 아래 항목들을 물어봅니다. 미리 준비해두면 협상 속도가 빨라지고 신뢰도가 올라갑니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {SELLER_CHECKLIST.map((section, si) => (
              <div key={si} style={{ border: '2px solid var(--ink)', borderRadius: 8, overflow: 'hidden', boxShadow: '3px 3px 0px var(--ink)' }}>
                <div style={{ padding: '14px 20px', background: section.bg, borderBottom: '2px solid var(--ink)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{section.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: section.color }}>{section.title}</span>
                </div>
                <div style={{ background: '#fff' }}>
                  {section.items.map((item, ii) => (
                    <div key={ii} style={{ padding: '14px 20px', borderBottom: ii < section.items.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 14 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: section.color, flexShrink: 0, marginTop: 7 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer section */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'var(--blue)', color: '#fff', fontFamily: "'DM Mono', monospace" }}>구매자</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>확인해야 할 질문들</h2>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 28 }}>
            첫 대화에서 바로 계약 얘기를 꺼내지 마세요. 아래 질문들을 순서대로 확인하면서 신뢰를 먼저 쌓으세요.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '2px solid var(--ink)', borderRadius: 8, overflow: 'hidden', boxShadow: '3px 3px 0px var(--ink)', background: '#fff' }}>
            {BUYER_CHECKLIST.map((item, i) => (
              <div key={i} style={{ padding: '16px 20px', borderBottom: i < BUYER_CHECKLIST.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text3)', paddingTop: 2, flexShrink: 0 }}>Q{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.q}</div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{item.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Red flags */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>레드 플래그</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
            아래 신호 중 하나라도 보이면 거래를 멈추고 다시 생각하세요.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RED_FLAGS.map((rf, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 6, background: '#fff',
                border: `2px solid ${rf.risk === 'HIGH' ? 'var(--red)' : 'var(--border)'}`,
                boxShadow: rf.risk === 'HIGH' ? '2px 2px 0px var(--red)' : '2px 2px 0px var(--border2)',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                  fontFamily: "'DM Mono', monospace",
                  background: rf.risk === 'HIGH' ? 'var(--red)' : 'var(--amber)',
                  color: '#fff',
                }}>{rf.risk}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{rf.flag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ padding: '20px 24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 48 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
            <strong>VibeSandbox는 거래의 당사자가 아닙니다.</strong> 저희는 발견과 첫 연결만 제공합니다. 거래 조건, 자산 이전, 대금 지급은 판매자와 구매자 사이에서 직접 이루어집니다. 필요하다면 법률 전문가 또는 M&A 브로커의 도움을 받으세요.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 32px', background: '#fff', border: '2px solid var(--ink)', borderRadius: 8, boxShadow: '4px 4px 0px var(--ink)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>아직 연결 전인가요?</div>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 24 }}>
            AI 점수순으로 정렬된 앱들을 둘러보세요.
          </p>
          <Link href="/feed" style={{
            display: 'inline-block', padding: '11px 28px',
            background: 'var(--ink)', color: 'var(--accent)',
            borderRadius: 4, fontSize: 14, fontWeight: 700, textDecoration: 'none',
            boxShadow: '2px 2px 0px var(--accent-dark)',
          }}>
            피드 보러 가기 →
          </Link>
        </div>

      </div>

      <footer style={{ borderTop: '2px solid var(--border2)', background: 'var(--bg2)', padding: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>VibeSandbox · AI curation · No payment processing</span>
      </footer>
    </div>
  );
}
