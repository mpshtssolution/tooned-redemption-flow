'use client'

import { useState } from 'react'

type Step = 'welcome' | 'details' | 'create' | 'extras' | 'delivery' | 'done'

export default function Home() {
  const [step, setStep] = useState<Step>('welcome')
  const [code, setCode] = useState('TOON-7K4P-92MX')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [extra, setExtra] = useState('')
  const [uploaded, setUploaded] = useState(false)

  const steps: Step[] = ['welcome', 'details', 'create', 'extras', 'delivery']
  const index = steps.indexOf(step)
  const progress = step === 'done' ? 100 : Math.max(8, ((index + 1) / steps.length) * 100)
  const next = (s: Step) => setStep(s)

  return <div className="shell">
    <div className="grain" />
    <header className="top"><div className="logo">TOONED<span>®</span></div><div className="pill">Your gift · Included</div></header>
    <div className="progress"><i style={{width:`${progress}%`}} /></div>

    {step === 'welcome' && <main><span className="float f1">made for you ↗</span><span className="float f2">✦</span><div className="grid"><section className="hero"><div className="step">01 / Your gift</div><h1>Your portrait is <em>waiting.</em></h1><p className="lede">Someone thought you deserved a little more personality. Your custom Tooned portrait is already yours — just make it you.</p><div className="codebox"><input value={code} onChange={e=>setCode(e.target.value)} aria-label="Gift code" /><button className="btn" onClick={()=>next('details')}>Let’s go →</button></div><p className="tiny">Gift code detected · no payment needed for your portrait</p></section><Art /></div></main>}

    {step === 'details' && <main><div className="grid"><section><div className="step">02 / About you</div><h1 className="hero" style={{fontFamily:'Fraunces,serif',fontSize:'clamp(55px,6vw,82px)',lineHeight:.92,letterSpacing:'-.06em'}}>Okay, who are we<br/><em>tooning?</em></h1><p className="lede">Just the basics. We’ll use these to send your portrait into the world.</p></section><section className="card"><div className="field"><label>YOUR NAME</label><input placeholder="e.g. Ankur" value={name} onChange={e=>setName(e.target.value)} /></div><div className="field"><label>EMAIL ADDRESS</label><input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} /></div><div className="actions"><button className="back" onClick={()=>next('welcome')}>← Back</button><button className="btn" onClick={()=>next('create')}>Create my portrait →</button></div></section></div></main>}

    {step === 'create' && <main><div className="grid"><section><div className="step">03 / Make it yours</div><h1 className="hero" style={{fontFamily:'Fraunces,serif',fontSize:'clamp(55px,6vw,82px)',lineHeight:.92,letterSpacing:'-.06em'}}>Give us your<br/><em>good side.</em></h1><p className="lede">Upload one clear photo. We’ll take it from here. No filters, no overthinking.</p><div className="actions"><button className="back" onClick={()=>next('details')}>← Back</button></div></section><section className="card"><div className="upload" onClick={()=>setUploaded(true)}>{uploaded ? <div><b>Photo added ✦</b><span>Looking good. We’re ready.</span></div> : <div><b>Drop your photo here</b><span>or click to choose from your device</span></div>}</div><div className="actions"><span className="tiny">JPG / PNG · up to 10MB</span><button className="btn" disabled={!uploaded} onClick={()=>next('extras')}>Looks good →</button></div></section></div></main>}

    {step === 'extras' && <main><div className="grid"><section><div className="step">04 / Optional extras</div><h1 className="hero" style={{fontFamily:'Fraunces,serif',fontSize:'clamp(55px,6vw,82px)',lineHeight:.92,letterSpacing:'-.06em'}}>Want to make<br/>it <em>extra?</em></h1><p className="lede">Your portrait is free. These are just tempting little upgrades — completely optional.</p></section><section className="card"><div className="choices"><button className={`choice ${extra==='print'?'selected':''}`} onClick={()=>setExtra(extra==='print'?'':'print')}><strong>Big fancy print</strong><small>12 × 16 in · + ₹899</small></button><button className={`choice ${extra==='frame'?'selected':''}`} onClick={()=>setExtra(extra==='frame'?'':'frame')}><strong>Premium frame</strong><small>Oak finish · + ₹1,499</small></button><button className={`choice ${extra==='second'?'selected':''}`} onClick={()=>setExtra(extra==='second'?'':'second')}><strong>One more portrait</strong><small>For your favourite human · + ₹699</small></button><button className={`choice ${extra==='rush'?'selected':''}`} onClick={()=>setExtra(extra==='rush'?'':'rush')}><strong>Skip the queue</strong><small>Priority dispatch · + ₹299</small></button></div><div className="price"><span>{extra ? 'Selected upgrade' : 'Your gift'}</span><span className={extra?'':'free'}>{extra ? '₹699 – ₹1,499' : '₹0 · Included'}</span></div><div className="actions"><button className="back" onClick={()=>next('create')}>← Back</button><button className="btn" onClick={()=>next('delivery')}>{extra?'Continue with upgrade →':'No thanks — keep my gift'}</button></div></section></div></main>}

    {step === 'delivery' && <main><div className="grid"><section><div className="step">05 / Almost there</div><h1 className="hero" style={{fontFamily:'Fraunces,serif',fontSize:'clamp(55px,6vw,82px)',lineHeight:.92,letterSpacing:'-.06em'}}>Where should<br/>we <em>send it?</em></h1><p className="lede">One last thing. Then we’ll get your portrait moving.</p></section><section className="card"><div className="field"><label>DELIVERY ADDRESS</label><textarea rows={4} placeholder="House / Flat, street, city, state, PIN" /></div><div className="field"><label>PHONE NUMBER</label><input placeholder="+91 98765 43210" /></div><div className="price"><span>Tooned portrait</span><span className="free">₹0 · Gift</span></div><div className="actions"><button className="back" onClick={()=>next('extras')}>← Back</button><button className="btn" onClick={()=>next('done')}>Confirm my gift →</button></div></section></div></main>}

    {step === 'done' && <main><section className="success"><div className="check">✓</div><div className="step">You’re officially Tooned</div><h1>That’s a<br/><em>wrap.</em></h1><p>Your portrait is on its way to becoming your new favourite thing. We’ll send the details to <strong>{email || 'your email'}</strong>.</p><div className="card" style={{marginTop:38,textAlign:'left'}}><div className="price" style={{borderTop:0,marginTop:0}}><span>Gift code</span><strong style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{code}</strong></div><div className="price"><span>Portrait</span><span className="free">Included</span></div><div className="price"><span>Order status</span><strong>Confirmed ✦</strong></div></div><button className="btn" style={{height:52,marginTop:25,padding:'0 30px'}} onClick={()=>setStep('welcome')}>Back to beginning ↗</button></section></main>}
  </div>
}

function Art(){return <div className="art" aria-hidden="true"><div className="sun"/><div className="blob"/><div className="spark s1">✦</div><div className="spark s2">✳</div><div className="face"><div className="hair"/><div className="eye l"/><div className="eye r"/><div className="smile"/><div className="shirt"/></div></div>}
