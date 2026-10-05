#!/usr/bin/env python3
"""Original deterministic 120-BPM percussion and click bed; no sampled music."""
import argparse
import math
import random
import struct
import wave


def synth(output, duration=16, bpm=120):
    rate=48000
    samples=[0.0]*int(duration*rate)
    rng=random.Random(47)
    def add(start, length, fn, gain):
        offset=int(start*rate)
        for n in range(int(length*rate)):
            at=offset+n
            if 0<=at<len(samples): samples[at]+=gain*fn(n/rate)
    beat=60/bpm
    for i in range(int(duration/beat)):
        start=i*beat
        if i%2==0: add(start,.22,lambda t:math.sin(2*math.pi*(58*t+4*(1-math.exp(-30*t))))*math.exp(-22*t),.25)
        if i%4==2: add(start,.11,lambda t:(rng.random()*2-1)*math.exp(-48*t),.085)
        add(start,.045,lambda t:(rng.random()*2-1)*math.exp(-95*t),.035)
        if i%4==0:
            for freq in [220,277.18,329.63]:add(start,.8,lambda t,f=freq:math.sin(2*math.pi*f*t)*math.exp(-4*t),.022)
    for i in range(int(duration/(4*beat))):
        add(i*4*beat+.9,.07,lambda t:math.sin(2*math.pi*1400*t)*math.exp(-75*t),.085)
    peak=max(abs(x) for x in samples) or 1
    with wave.open(str(output),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
        pcm=bytearray()
        for n,x in enumerate(samples):
            fade=min(1,n/rate/.03,(duration-n/rate)/.55)
            v=round(x/peak*.42*max(0,fade)*32767);pcm.extend(struct.pack('<hh',v,v))
        w.writeframes(pcm)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('output');p.add_argument('--duration',type=float,default=16);p.add_argument('--bpm',type=float,default=120);a=p.parse_args();synth(a.output,a.duration,a.bpm)
