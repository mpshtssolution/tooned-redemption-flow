'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Step = 'welcome' | 'details' | 'create' | 'extras' | 'delivery' | 'done'
type Extra = 'print' | 'frame' | 'second' | 'rush' | ''

const extraData: Record<Exclude<Extra, ''>, { name: string; detail: string; price: number }> = {
  print: { name: 'Big fancy print', detail: '12 × 16 in · museum-quality paper', price: 899 },
  frame: { name: 'Premium frame', detail: 'Solid oak finish · ready to hang', price: 1499 },
  second: { name: 'One more portrait', detail: 'A second Tooned human · same order', price: 699 },
  rush: { name: 'Skip the queue', detail: 'Priority dispatch · ships sooner', price: 299 },
}

export default function Home() {
  const [step, setStep] = useState<Step>('welcome')
  const [code, setCode] = useState('TOON-7K4P-92MX')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [extra, setExtra] = useState<Extra>('')
  const [uploaded, setUploaded] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qrCode = params.get('code')
    if (qrCode) setCode(qrCode.toUpperCase())
  }, [])

  const steps: Step[] = ['welcome', 'details', 'create', 'extras', 'delivery']
  const index = steps.indexOf(step)
  const progress = step === 'done' ? 100 : Math.max(8, ((index + 1) / steps.length) * 100)
  const selectedExtra = extra ? extraData[extra] : null
  const price = useMemo(() => selectedExtra?.price ?? 0, [selectedExtra])
  const next = (s: Step) => setStep(s)

  function handleFile(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) return
    setUploaded(true)
    setFileName(file.name)
  }

  return <div className="shell">
    <div className="grain" />
    <header className="top"><div className="logo">TOONED<span>®</span></div><div className="pill">Your gift · Included</div></header>
    <div className="progress"><i style={{ width: `${progress}%` }} /></div>

    {step === 'welcome' && <main><span className="float f1">made for you ↗</span><span className="float f2">✦</span><div className="grid"><section className="hero"><div className="step">01 / Your gift</div><h1>Your portrait is <em>waiting.</em></h1><p className="lede">Someone thought you deserved a little more personality. Your custom Tooned portrait is already yours — just make it you.</p><div className="codebox"><input value={code} onChange={e => setCode(e.target.value)} aria-label="Gift code" /><button className="btn" onClick={() => next('details')}>Let’s go →</button></div><p className="tiny">Gift code detected · no payment needed for your portrait</p></section><Art /></div></main>}

    {step === 'details' && <main><div className="grid"><section><div className="step">02 / About you</div><h1 className="display">Okay, who are we<br/><em>tooning?</em></h1><p className="lede">Just the basics. We’ll use these to send your portrait into the world.</p></section><section className="card"><div className="field"><label>YOUR NAME</label><input placeholder="e.g. Ankur" value={name} onChange={e => setName(e.target.value)} /></div><div className="field"><label>EMAIL ADDRESS</label><input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div><div className="actions"><button className="back" onClick={() => next('welcome')}>← Back</button><button className="btn" onClick={() => next('create')}>Create my portrait →</button></div></section></div></main>}

    {step === 'create' && <main><div className="grid"><section><div className="step">03 / Make it yours</div><h1 className="display">Give us your<br/><em>good side.</em></h1><p className="lede">One clear photo is all we need. We’ll take it from here. No filters, no overthinking.</p><div className="actions"><button className="back" onClick={() => next('details')}>← Back</button></div></section><section className="card"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => handleFile(e.target.files?.[0])} /><div className={`upload ${uploaded ? 'uploaded' : ''}`} onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}>{uploaded ? <div><div className="uploadIcon">✓</div><b>Photo added ✦</b><span>{fileName || 'Looking good. We’re ready.'}</span><small>Click to choose another</small></div> : <div><div className="uploadIcon">↑</div><b>Drop your photo here</b><span>or click to choose from your device</span><small>We recommend a clear, front-facing photo</small></div>}</div><div className="actions"><span className="tiny">JPG / PNG / WEBP · up to 10MB</span><button className="btn" disabled={!uploaded} onClick={() => next('extras')}>Looks good →</button></div></section></div></main>}

    {step === 'extras' && <main><div className="grid"><section><div className="step">04 / Optional extras</div><h1 className="display">Want to make<br/>it <em>extra?</em></h1><p className="lede">Your portrait is already yours. These are just tempting little upgrades — completely optional.</p><div className="giftNote"><span>✦</span><div><strong>Your original gift stays ₹0</strong><small>Nothing here is required to redeem it.</small></div></div></section><section className="card"><div className="choices">{(Object.keys(extraData) as Exclude<Extra, ''>[]).map(key => { const item = extraData[key]; return <button key={key} className={`choice ${extra === key ? 'selected' : ''}`} onClick={() => setExtra(extra === key ? '' : key)}><span className="choiceTick">{extra === key ? '✓' : '+'}</span><div><strong>{item.name}</strong><small>{item.detail}</small></div><b>+ ₹{item.price.toLocaleString('en-IN')}</b></button> })}</div><div className="price"><span>{selectedExtra ? selectedExtra.name : 'Your gift'}</span><span className={selectedExtra ? '' : 'free'}>{selectedExtra ? `₹${price.toLocaleString('en-IN')}` : '₹0 · Included'}</span></div><div className="actions"><button className="back" onClick={() => next('create')}>← Back</button><button className="btn" onClick={() => next('delivery')}>{selectedExtra ? 'Continue with upgrade →' : 'No thanks — keep my gift'}</button></div></section></div></main>}

    {step === 'delivery' && <main><div className="grid"><section><div className="step">05 / Almost there</div><h1 className="display">Where should<br/>we <em>send it?</em></h1><p className="lede">One last thing. Then we’ll get your portrait moving.</p></section><section className="card"><div className="field"><label>DELIVERY ADDRESS</label><textarea rows={4} placeholder="House / Flat, street, city, state, PIN" /></div><div className="field"><label>PHONE NUMBER</label><input placeholder="+91 98765 43210" /></div><div className="price"><span>Tooned portrait</span><span className="free">₹0 · Gift</span></div>{selectedExtra && <div className="price"><span>{selectedExtra.name}</span><span>+ ₹{price.toLocaleString('en-IN')}</span></div>}<div className="actions"><button className="back" onClick={() => next('extras')}>← Back</button><button className="btn" onClick={() => next('done')}>{selectedExtra ? `Review ₹${price.toLocaleString('en-IN')} →` : 'Confirm my gift →'}</button></div></section></div></main>}

    {step === 'done' && <main><section className="success"><div className="check">✓</div><div className="step">You’re officially Tooned</div><h1>That’s a<br/><em>wrap.</em></h1><p>Your portrait is on its way to becoming your new favourite thing. We’ll send the details to <strong>{email || 'your email'}</strong>.</p><div className="card" style={{ marginTop: 38, textAlign: 'left' }}><div className="price" style={{ borderTop: 0, marginTop: 0 }}><span>Gift code</span><strong className="mono">{code}</strong></div><div className="price"><span>Portrait</span><span className="free">Included</span></div>{selectedExtra && <div className="price"><span>{selectedExtra.name}</span><span>₹{price.toLocaleString('en-IN')}</span></div>}<div className="price"><span>Order status</span><strong>Confirmed ✦</strong></div></div><button className="btn" style={{ height: 52, marginTop: 25, padding: '0 30px' }} onClick={() => setStep('welcome')}>Back to beginning ↗</button></section></main>}
  </div>
}

function Art() { return <div className="art" aria-hidden="true"><div className="sun"/><div className="blob"/><div className="spark s1">✦</div><div className="spark s2">✳</div><div className="face"><div className="hair"/><div className="eye l"/><div className="eye r"/><div className="smile"/><div className="shirt"/></div></div> }
