import { defined } from "./util";

let context: AudioContext | undefined; 
let gain: GainNode | undefined;

    const oscillators: OscillatorNode[] = [];
    const cnt = 1;


export function play(values: number[]) {
    console.log(`playing ${values.length} samples`);

    function startSound() {
        context ??= new AudioContext();
        gain ??= context.createGain();
        for (let i = 0; i < cnt; i++) {
            oscillators[i] = context.createOscillator();
            oscillators[i].connect(gain);
            oscillators[i].type = "sine";
        }
        gain!.connect(context!.destination);
        gain!.gain.value = 1;

        for (let i = 0; i < cnt; i++) {
            oscillators[i].start(context.currentTime);
            oscillators[i].frequency.value = 50;
        }
    }

    function stopSound() {
        if (defined(context)) {
            for (const oscillator of oscillators) {
                oscillator.stop(context.currentTime);
            }
        }
    }

    const beep = function (freq: number) {
        for (const oscillator of oscillators) {

            if (oscillator != null) {
                if (freq > 0) {
                    oscillator.type = "sine";
                } else {
                    oscillator.type = "sawtooth";
                    freq = freq * -1;
                }
                oscillator.frequency.value = freq;
            }
        }
    };

    const [min, max] = values.reduce(([min, max], b) => [Math.min(min, b), Math.max(max, b)], [0, 0]);

    const scale = 4000 / (max - min);
    const offset = 0 - min;
    console.log({ cnt: values.length, min, max, scale });

    
    startSound();
    let idx = 0;
    const interval = setInterval(() => {
        if (idx >= values.length) { clearInterval(interval); stopSound(); return }
        const freq = 100 + scale * (values[idx] + offset)
        console.log( {idx, value: values[idx], freq: freq })
        beep(freq);
        idx++;
    }, 10);
        


}