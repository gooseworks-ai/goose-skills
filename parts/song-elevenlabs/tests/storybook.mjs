// Shared plan data for the song-elevenlabs tests.
// The song-driven music video's shape (MASTER-PLAN-v2 §5.10): 14 tableaux, an instrumental intro,
// the hook on scene 8, the last scene under the end card.
export const storybookScenes = [
  { id: 's1', line: null, picture: 'a paper bedroom at night' },
  { id: 's2', line: 'Another night, the screen' },
  { id: 's3', line: 'is glowing bright.' },
  { id: 's4', line: 'I scroll and scroll.' },
  { id: 's5', line: 'Endless feeds and the' },
  { id: 's6', line: 'night just slows.' },
  { id: 's7', line: 'Then I close my eyes.' },
  { id: 's8', line: 'Fall into the dream.' },
  { id: 's9', line: 'Paper moon above me.' },
  { id: 's10', line: 'Stars stitched in seams.' },
  { id: 's11', line: 'Loona takes me there.' },
  { id: 's12', line: 'Every night I land' },
  { id: 's13', line: 'somewhere soft.' },
  { id: 's14', line: 'Fall asleep with Loona.' },
];
export const storybookInputs = () => ({
  scenes: storybookScenes,
  mood: 'dreamy synth lullaby, calm',
  singer: 'soft breathy female lead',
  brief: 'lead vocal up front; no artist names',
  avoid: ['metal', 'rap'],
  sections: [
    { name: 'Intro', seconds: 3, scenes: [1, 1], styles: ['instrumental', 'soft pads'], avoid: ['vocals'] },
    { name: 'Verse', seconds: 7, scenes: [2, 4] },
    { name: 'Pre-Chorus', seconds: 5, scenes: [5, 7], styles: ['building'] },
    { name: 'Chorus', seconds: 8, scenes: [8, 11], styles: ['atmospheric drop', 'dreamy hook on the word fall'] },
    { name: 'Outro', seconds: 5, scenes: [12, 14] },
  ],
  hook: 'Fall',
  hook_scene: 8,
  ending_scenes: 1,
  pronunciations: [{ term: 'Loona', say_as: 'Loo nah' }],
});
