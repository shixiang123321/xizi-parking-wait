import { Fragment, StrictMode, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import backgroundImage from './assets/background.webp'
import xiziLogo from './assets/xizi-logo.png'
import './styles.css'

const ASSETS = {
  background: backgroundImage,
  logo: xiziLogo,
}

const PLATES = [
  '浙B·5Q8L6',
  '浙D·2N9R7',
  '浙F·8C4P1',
  '浙J·6W3X9',
  '苏E·9H2T5',
  '苏A·6K8P3',
  '沪C·9M2Q7',
  '皖A·5T7N1',
]

const HEADING = '因车位分布不规则，取车时间可能略有延迟，感谢您的理解与耐心等候！'
const LIGHT_HEADING_START = HEADING.indexOf('感谢')
const TYPE_INTERVAL = 100
const HOLD_DURATION = 20000
const CLEAR_DURATION = 380
const RESTART_DELAY = 700

function TypewriterHeading() {
  const [visible, setVisible] = useState(0)
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer
    const wait = (duration) => new Promise((resolve) => {
      timer = window.setTimeout(resolve, duration)
    })

    const play = async () => {
      await wait(400)

      while (!cancelled) {
        setIsClearing(false)

        for (let index = 1; index <= HEADING.length && !cancelled; index += 1) {
          setVisible(index)
          await wait(TYPE_INTERVAL)
        }

        if (cancelled) return
        await wait(HOLD_DURATION)
        if (cancelled) return

        setIsClearing(true)
        await wait(CLEAR_DURATION)
        if (cancelled) return

        setVisible(0)
        setIsClearing(false)
        await wait(RESTART_DELAY)
      }
    }

    play()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <h1 className={`hero__title${isClearing ? ' hero__title--clearing' : ''}`} aria-label={HEADING}>
      {HEADING.split('').map((character, index) => (
        <Fragment key={`${character}-${index}`}>
          {index === LIGHT_HEADING_START && <br aria-hidden="true" />}
          <span
            aria-hidden="true"
            className={`type-char${index < visible ? ' type-char--visible' : ''}${index >= LIGHT_HEADING_START ? ' text-light' : ''}`}
          >
            {character}
          </span>
        </Fragment>
      ))}
      {visible < HEADING.length && <span className="type-cursor" aria-hidden="true" />}
    </h1>
  )
}

function normalizePlate(value) {
  const compact = value.replace(/\s+/g, '').toUpperCase()
  if (!compact.includes('·') && /^[\u4e00-\u9fff][A-Z]/.test(compact) && compact.length > 2) {
    return `${compact.slice(0, 2)}·${compact.slice(2)}`
  }
  return compact
}

function PlateSearch({ onVehicleConfirmed }) {
  const [isOpen, setIsOpen] = useState(false)
  const [plate, setPlate] = useState('')
  const [status, setStatus] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isModalOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsModalOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isModalOpen])

  const openSearch = () => {
    setIsOpen(true)
    setStatus(null)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!isOpen) return

    const normalized = normalizePlate(plate)
    if (!PLATES.includes(normalized)) {
      setStatus(null)
      setIsModalOpen(true)
      return
    }

    setPlate(normalized)
    setStatus({ type: 'success', message: `已确认 ${normalized}` })
    onVehicleConfirmed(normalized)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setPlate('')
    setStatus(null)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <form className="plate-query" onSubmit={handleSubmit}>
      <div className="hero__action-row">
        <div className="btn-border-wrap btn-border-wrap--large">
          {isOpen ? (
            <input
              ref={inputRef}
              className="plate-query__input"
              value={plate}
              onChange={(event) => {
                setPlate(event.target.value.slice(0, 10))
                setStatus(null)
              }}
              aria-label="输入车牌号"
              autoComplete="off"
              autoFocus
              inputMode="text"
              placeholder="请输入车牌号"
            />
          ) : (
            <button className="pill-button pill-button--primary" type="button" onClick={openSearch}>
              <span>车牌查询</span>
            </button>
          )}
        </div>
      </div>
      <div className="query-confirm-row">
        <button className="query-confirm" type="submit" disabled={!isOpen}>确认</button>
        {status && <span className={`plate-query__status plate-query__status--${status.type}`} role="status">{status.message}</span>}
      </div>
      {isModalOpen && createPortal((
        <div
          className="vehicle-modal__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <section className="vehicle-modal" role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title" aria-describedby="vehicle-modal-description">
            <span className="vehicle-modal__icon" aria-hidden="true">!</span>
            <h2 id="vehicle-modal-title">无车辆信息</h2>
            <p id="vehicle-modal-description">请重新输入车牌号</p>
            <button type="button" onClick={closeModal} autoFocus>重新输入</button>
          </section>
        </div>
      ), document.body)}
    </form>
  )
}

function Header() {
  return (
    <header className="header">
      <a className="brand" href="#top" aria-label="西子智能首页">
        <img src={ASSETS.logo} alt="西子智能" />
      </a>
    </header>
  )
}

const orbitVehicles = [
  { plate: PLATES[0], orbit: 1, angle: 270, radius: 177, width: 122, height: 40, fontSize: 15, tone: 'violet', delay: '.6s' },
  { plate: PLATES[1], orbit: 2, angle: 60, radius: 251, width: 142, height: 44, fontSize: 17, tone: 'cyan', delay: '.85s' },
  { plate: PLATES[2], orbit: 2, angle: 180, radius: 251, width: 166, height: 50, fontSize: 19, tone: 'violet', delay: '1.05s' },
  { plate: PLATES[3], orbit: 2, angle: 300, radius: 251, width: 132, height: 42, fontSize: 16, tone: 'ice', delay: '1.25s' },
  { plate: PLATES[4], orbit: 3, angle: 130, radius: 325, width: 178, height: 54, fontSize: 20, tone: 'rose', delay: '1.5s' },
  { plate: PLATES[5], orbit: 4, angle: 30, radius: 399, width: 146, height: 44, fontSize: 17, tone: 'cyan', delay: '1.65s' },
  { plate: PLATES[6], orbit: 4, angle: 145, radius: 399, width: 184, height: 56, fontSize: 20, tone: 'violet', delay: '1.9s' },
  { plate: PLATES[7], orbit: 4, angle: 260, radius: 399, width: 158, height: 48, fontSize: 18, tone: 'ice', delay: '2.15s' },
]

function Orbit({ number, children }) {
  return <div className={`orbit orbit--${number}`}><div className="orbit__spinner">{children}</div></div>
}

function TalentUniverse({ selectedPlate, estimatedTime }) {
  return (
    <div className="universe-stage" aria-label="八辆等待取车车辆正在环形轨道上运行">
      <div className="universe">
        {[4, 3, 2, 1].map((orbit) => (
          <Orbit number={orbit} key={orbit}>
            {orbitVehicles.filter((vehicle) => vehicle.orbit === orbit).map((vehicle) => {
              const [region, serial] = vehicle.plate.split('·')
              return (
                <div
                  className="orbit-item-anchor"
                  key={vehicle.plate}
                  style={{ '--angle': `${vehicle.angle}deg`, '--radius': `${vehicle.radius}px` }}
                >
                  <div className="orbit-item-counter">
                    <div
                      className={`orbit-plate orbit-plate--${vehicle.tone}`}
                      role="img"
                      aria-label={`车牌 ${vehicle.plate}`}
                      style={{
                        '--plate-width': `${vehicle.width}px`,
                        '--plate-height': `${vehicle.height}px`,
                        '--plate-font-size': `${vehicle.fontSize}px`,
                        '--fly-delay': vehicle.delay,
                      }}
                    >
                      <span className="orbit-plate__signal" aria-hidden="true" />
                      <span className="orbit-plate__region" aria-hidden="true">{region}</span>
                      <span className="orbit-plate__separator" aria-hidden="true">·</span>
                      <span className="orbit-plate__serial" aria-hidden="true">{serial}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </Orbit>
        ))}
        <div className="universe__center" aria-label={`${selectedPlate}，预计取车时间${estimatedTime}`}>
          <span className="universe__center-plate"><i aria-hidden="true" />{selectedPlate}</span>
          <span className="universe__center-label">预计取车时间</span>
          <strong className="universe__center-time">{estimatedTime}</strong>
        </div>
      </div>
    </div>
  )
}

function LogoTicker() {
  const repeated = useMemo(() => Array.from({ length: 4 }, () => PLATES).flat(), [])
  return (
    <section className="logo-strip" aria-label="等待取车车辆">
      <div className="logo-strip__track" role="list">
        {repeated.map((plate, index) => (
          <span
            className="license-plate"
            role="listitem"
            aria-hidden={index >= PLATES.length}
            key={`${plate}-${index}`}
          >
            {plate}
          </span>
        ))}
      </div>
    </section>
  )
}

function App() {
  const [pickupInfo, setPickupInfo] = useState({
    plate: '浙A·7K3M2',
    estimatedTime: '5~10分钟',
  })

  return (
    <main className="app" id="top" style={{ '--background-image': `url(${ASSETS.background})` }}>
      <Header />
      <section className="hero">
        <div className="hero__content">
          <TypewriterHeading />
          <PlateSearch
            onVehicleConfirmed={(plate) => setPickupInfo({ plate, estimatedTime: '20~30分钟' })}
          />
        </div>
        <TalentUniverse selectedPlate={pickupInfo.plate} estimatedTime={pickupInfo.estimatedTime} />
      </section>
      <LogoTicker />
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
