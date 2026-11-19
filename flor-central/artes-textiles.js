// Load the interactive scene only when the visitor opens it.
(() => {
  const viewer = document.getElementById('visor-textiles');
  const host = document.getElementById('vista-textiles');
  const query = new URLSearchParams(location.search);
  let sizing;

  function toggle() {
    if (!viewer.open) {
      sizing?.disconnect();
      host.replaceChildren();
      return;
    }
    if (host.firstElementChild) return;
    const frame = document.createElement('iframe');
    const url = new URL('cinema.html', location.href);
    url.searchParams.set('rev', 'F08');
    url.searchParams.set('tallo', query.get('tallo') === 'bambu' ? 'bambu' : 'fibras');
    url.searchParams.set('galeria', '1');
    frame.src = url.href;
    frame.title = 'Flor central en 3D con selector de tallo y hojas de bore';
    frame.allowFullscreen = true;
    frame.addEventListener('load', () => {
      sizing?.disconnect();
      const scene = frame.contentDocument?.querySelector('main');
      if (!scene || !frame.isConnected) return;
      for (const link of frame.contentDocument.querySelectorAll('a[href]')) {
        link.target = '_top';
      }
      const fit = () => {
        const sceneHeight = Math.ceil(scene.offsetTop + scene.getBoundingClientRect().height) + 2;
        if (sceneHeight > 100) frame.style.height = sceneHeight + 'px';
      };
      fit();
      sizing = new ResizeObserver(fit);
      sizing.observe(scene);
    });
    host.append(frame);
  }
  viewer.addEventListener('toggle', toggle);
  if (query.get('visor') === '1') viewer.open = true;
})();
