import { useEffect, useState } from 'react'

export default function AnimationDiagnostics() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const reduced =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

    const hover =
      window.matchMedia(
        '(hover: hover) and (pointer: fine)',
      ).matches

    setData({
      reduced,
      hover,
      visibility: document.visibilityState,
      hardwareConcurrency:
        navigator.hardwareConcurrency || '—',
      userAgent: navigator.userAgent,
    })
  }, [])

  if (!data) return null

  return (
    <div className="admin-animation-diagnostics">
      <div>
        <strong>Diagnóstico de animaciones</strong>
        <p>
          Abrí esta sección desde el navegador que tiene
          problemas para comparar la configuración.
        </p>
      </div>

      <dl>
        <div>
          <dt>Reducir movimiento</dt>
          <dd className={data.reduced ? 'bad' : 'good'}>
            {data.reduced
              ? 'ACTIVADO'
              : 'DESACTIVADO'}
          </dd>
        </div>

        <div>
          <dt>Mouse / hover fino</dt>
          <dd>{data.hover ? 'SÍ' : 'NO'}</dd>
        </div>

        <div>
          <dt>Pestaña visible</dt>
          <dd>{data.visibility}</dd>
        </div>

        <div>
          <dt>CPU lógica</dt>
          <dd>{data.hardwareConcurrency}</dd>
        </div>
      </dl>

      <code>{data.userAgent}</code>
    </div>
  )
}
