import noiseModule from './lib/noise.js';
const { noise } = noiseModule;
const TWO_PI = Math.PI * 2;

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const seed = 4294267596;


class NoisePainter {

  static inputProperties = ['--color1', '--color2', '--power', '--angle', '--gradientType', '--radialGradientStart', '--radialGradientRadius'];

  paint(ctx, geometry, properties) {
    const { width, height } = geometry;

    const colorA = JSON.parse(properties.get('--color1'));
    const colorB = JSON.parse(properties.get('--color2'));
    const power = parseFloat(properties.get('--power')) || 2;
    const angle = parseFloat(properties.get('--angle')) || 0;
    const gradientType = (properties.get('--gradientType')[0] || 'linear').trim();

    const makeRand = () => mulberry32(seed);

    noise.seed(12345);

    const rand = makeRand();
    // Generate noise between 0 and 1.
    const noiz = (x, y) => (noise.simplex2(x, y) + 1) / 2;

    const mix = (x, y, a) => x + a * (y - x);
    const mix3 = (xs, ys, a) => [
      mix(xs[0], ys[0], a),
      mix(xs[1], ys[1], a),
      mix(xs[2], ys[2], a),
    ];

    const rand3 = (xs, ys, a) => (rand() > a) ? xs : ys;

    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {

        let value;
        const max = Math.max(width, height);
        if (gradientType === 'linear') {
          const distanceToCentre = Math.hypot(height / 2 - y, width / 2 - x) / (Math.hypot(max, max) / 2);
          let angleToCentre = Math.atan2(y - height / 2, x - width / 2);
          const a = distanceToCentre * Math.cos(angleToCentre - angle);
          value = (0.5 - a);
        } else if (gradientType === 'radial') {
          const property = properties.get('--radialGradientStart');
          const radius = parseFloat(properties.get('--radialGradientRadius')[0] || Math.hypot(max, max));
          const startPoint = property ? JSON.parse(property) : [0.5, 0.5];
          const distanceToPoint = Math.hypot(x - startPoint[0] * width, y - startPoint[0] * width);
          value = distanceToPoint / radius;
        }

        let color = mix3(colorA, colorB, value);
        const n = noiz(x, y);
        const mixColor = mix3(colorA, colorB, n);

        if (value <= 0.5) {
          let v = value * 2;
          v = Math.pow(v, power);
          color = rand3(colorA, mixColor, v);
        } else {
          let v = 1 - (value - 0.5) * 2;
          v = 1 - Math.pow(v, power);
          color = rand3(mixColor, colorB, v);
        }

        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 255)`;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }
  }
}

registerPaint('noiseGradient', NoisePainter);
