// El análisis se hace localmente; los nodos de audio no se conectan a la salida.
export function prepararMicrofono(boton, nota, soplar) {
  let corriente, contexto, fotograma, sesion = 0;
  const reposo = 'El micrófono es opcional. El sonido se procesa en tu equipo.';
  function detener(mensaje = reposo) {
    sesion++;
    cancelAnimationFrame(fotograma);
    corriente?.getTracks().forEach(pista => pista.stop());
    corriente = null;
    if (contexto && contexto.state !== 'closed') contexto.close().catch(() => {});
    contexto = null;
    boton.disabled = false;
    boton.setAttribute('aria-pressed', 'false');
    boton.textContent = 'Soplar con el micrófono';
    nota.textContent = mensaje;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
    boton.disabled = true;
    nota.textContent = 'En este navegador puedes usar el botón Soplar.';
    return;
  }
  boton.disabled = false;
  boton.addEventListener('click', async () => {
    if (corriente) { detener(); return; }
    const solicitud = ++sesion;
    boton.disabled = true;
    nota.textContent = 'Esperando permiso para usar el micrófono…';
    try {
      const audio = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false, noiseSuppression:false, autoGainControl:false}});
      if (sesion !== solicitud) { audio.getTracks().forEach(p => p.stop()); return; }
      corriente = audio;
      const ctx = new AudioContext();
      contexto = ctx;
      await ctx.resume();
      if (sesion !== solicitud) return;
      const analizador = ctx.createAnalyser();
      analizador.fftSize = 1024;
      ctx.createMediaStreamSource(audio).connect(analizador);
      const muestras = new Float32Array(analizador.fftSize);
      let base = 0.003, seguido = 0, anterior = performance.now(), proximo = 0;
      const calibrandoHasta = anterior + 600;
      boton.disabled = false;
      boton.textContent = 'Apagar micrófono';
      boton.setAttribute('aria-pressed', 'true');
      nota.textContent = 'Sopla brevemente hacia el micrófono.';
      const escuchar = ahora => {
        analizador.getFloatTimeDomainData(muestras);
        let suma = 0;
        for (const v of muestras) suma += v * v;
        const volumen = Math.sqrt(suma / muestras.length);
        const dt = Math.min(100, ahora - anterior);
        anterior = ahora;
        if (ahora < calibrandoHasta || volumen < base * 1.6) base += (Math.min(volumen, 0.07) - base) * 0.09;
        const umbral = Math.max(0.012, base * 2.5);
        seguido = volumen > umbral ? seguido + dt : 0;
        if (ahora > calibrandoHasta && seguido > 85 && ahora >= proximo) {
          soplar(Math.min(1, volumen / (umbral * 4)));
          seguido = 0;
          proximo = ahora + 1000;
        }
        fotograma = requestAnimationFrame(escuchar);
      };
      audio.getAudioTracks()[0]?.addEventListener('ended', () => {
        if (sesion === solicitud) detener('El micrófono se desconectó. Puedes usar el botón Soplar.');
      }, {once:true});
      fotograma = requestAnimationFrame(escuchar);
    } catch (error) {
      if (sesion === solicitud) detener(error.name === 'NotAllowedError' ?
        'El micrófono quedó sin permiso. Puedes usar el botón Soplar.' :
        'No se pudo abrir el micrófono. Puedes usar el botón Soplar.');
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) detener(); });
  window.addEventListener('pagehide', () => detener());
}
