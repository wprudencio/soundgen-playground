| Rank | Waveform                | Method/Function          | CPU Usage      | Notes                                                  |
|------|-------------------------|--------------------------|----------------|--------------------------------------------------------|
| 1    | Phasor                  | phasor(frequency)        | Very Low       | Linear ramp, minimal math                              |
| 2    | Square                  | square(frequency)        | Very Low       | Simple phase comparison                                |
| 3    | Saw                     | saw(frequency)           | Very Low       | Simple math                                            |
| 4    | Impulse                 | impulse(frequency)       | Very Low       | Just a comparison                                      |
| 5    | Triangle                | triangle(frequency)      | Low            | Slightly more math than square/saw                     |
| 6    | Pulse                   | pulse(frequency, duty)   | Low            | Similar to square                                      |
| 7    | Wavetable Sine (linear) | sinebuf(frequency)       | Low            | Table lookup, fast                                     |
| 8    | Wavetable Sine (quad)   | sinebuf4(frequency)      | Low/Medium     | Table lookup, more interpolation                       |
| 9    | Noise                   | noise()                  | Low/Medium     | Random number generation                               |
| 10   | Sine wave               | sinewave(frequency)      | Medium/High    | Uses trigonometry (`sin()`)                            |
| 11   | Cosine wave             | coswave(frequency)       | Medium/High    | Uses trigonometry (`cos()`)                            |
| 12   | Bandlimited Saw         | sawn(frequency)          | High           | Anti-aliasing, more complex math                       |