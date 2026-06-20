/* ── KAWADER Bootcamp 2026 — Mission System ──
   Lightweight mission engine: 3 daily missions, scene-based rewards.
   No XP, coins, or competition. Creative + reflective only.
   ──────────────────────────────────────────────────────── */

var KawaderMissions = (function(){
  'use strict';

  /* ── Storage keys ── */
  var MISSION_KEY  = 'kawader_missions_v1';
  var SCENES_KEY   = 'kawader_scenes_v1';
  var VISITED_KEY  = 'kawader_sim_visited_v3';
  var NOTES_KEY    = 'kawader_scout_notes_v1';

  /* ── Mission states ── */
  var STATE = { AVAILABLE: 'available', ACTIVE: 'active', COMPLETED: 'completed', CLAIMED: 'claimed' };

  /* ── Zone metadata (id → title) for display ── */
  var ZONE_NAMES = {
    z01_sammer_workshop:       "Sammer's Instrument Workshop",
    z02_bedrooms_3rd_floor:    "Bedrooms with Signature Walls",
    z03_bathrooms_main:        "Main Bathrooms",
    z04_bathroom_derelict:     "Derelict Bathroom",
    z05_roof:                  "Rooftop",
    z06_music_hall_grand_piano:"Grand Piano Hall",
    z07_dining_hall:           "Dining Hall",
    z08_practice_rooms:        "Practice & Small Studios",
    z09_equipment_room_ground: "Ground-floor Equipment Room",
    z10_storage_attic:         "Old Storage Attic",
    z11_outdoor_courtyard_garden:"Outdoor Courtyard & Garden",
    z12_wall_text_motifs:      "Wall Text & Symbols",
    z13_exterior_views:        "Window & Rooftop Views",
    z14_utility_basement:      "Utility Basement",
    z15_chalkboard_classroom_assets:"Classroom Assets",
    z16_kitchen_derelict:      "Old Kitchen",
    z17_rusted_door_arrow:     "Iron Door & Red Arrow",
    z18_main_stone_facade:     "Main Stone Facade"
  };

  /* ── Scene rewards ── */
  var SCENES = {
    d1_main: {
      id: 'scene_d1_main',
      title: 'First Frame',
      narrative: 'The first frame — your eye finding composition in an unfamiliar space. The way light falls on stone, the geometry of a doorway, the accidental beauty of a peeling wall. You are learning to see.'
    },
    d1_explore: {
      id: 'scene_d1_explore',
      title: 'Workshop Resonance',
      narrative: 'The tap of a mallet on wood. The quiet scratch of sandpaper across a violin belly. A half-finished instrument breathes with the patience of making. In the silence between tools, the workshop tells its own story.'
    },
    d1_reflect: {
      id: 'scene_d1_reflect',
      title: 'Arrival',
      narrative: 'The moment of arrival — the smell of stone and olive trees, the echo of footsteps in an empty hallway, the feeling of being somewhere that holds stories. This is where your film begins.'
    },
    d2_main: {
      id: 'scene_d2_main',
      title: 'Light Study',
      narrative: 'You chased the light today. Through a rooftop sunrise, a corridor silhouette, a dust mote suspended in a shaft of gold. Light is not something you capture — it is something you learn to follow.'
    },
    d2_explore: {
      id: 'scene_d2_explore',
      title: 'Textures of Time',
      narrative: 'A rusted hinge. A chalk scrawl on a blackboard. The weave of an old curtain. The camera loves what the eye rushes past. Today you stopped to look at what the world usually ignores.'
    },
    d2_reflect: {
      id: 'scene_d2_reflect',
      title: 'The Mirror',
      narrative: 'Writing is its own kind of seeing. Putting words to what you experienced forces you to understand it differently. Today you found meaning not in what you filmed, but in what you noticed.'
    },
    d3_main: {
      id: 'scene_d3_main',
      title: 'The Interview',
      narrative: 'You pointed the camera at someone and asked a question. For a moment, the distance between filmmaker and subject dissolved. You realized: every good film starts with genuine curiosity about another person.'
    },
    d3_explore: {
      id: 'scene_d3_explore',
      title: 'Hidden Corners',
      narrative: 'The basement holds its own weather. A boiler exhales warmth. Pipes knock. A single bulb casts long shadows. Some stories live in the places people forget — and that is exactly why you went there.'
    },
    d3_reflect: {
      id: 'scene_d3_reflect',
      title: 'The Edit Room',
      narrative: 'You sat with your footage today, making choices. This moment, not that one. This angle, not the other. Editing is not cutting — it is discovering what you actually made. The film reveals itself in the selection.'
    }
  };

  /* ── Mission definitions ── */
  var DAYS = [
    {
      day: 1,
      label: 'Day One · Orientation',
      missions: [
        {
          id: 'd1_main',
          type: 'main',
          title: 'Find Your Frame',
          summary: 'Visit two zones. For each, pause and notice the story the space tells through its light, lines, and textures.',
          detail: 'Walk through the venue and visit at least 2 different zones. In each one, take a moment to observe: where does the light come from? What lines guide your eye? What story does this space want to tell?',
          action: 'visit_zones',
          count: 2,
          scene_id: 'scene_d1_main',
          icon: '🎬'
        },
        {
          id: 'd1_explore',
          type: 'exploration',
          title: 'The Workshop Echo',
          summary: 'Visit Sammer\'s workshop and drop a note capturing one sound that defines the space.',
          detail: 'Head to the instrument workshop. Listen. Every workspace has a sonic signature — the tap of a tool, the creak of wood, the quiet focus of someone making. Drop a note describing one sound that tells the story of craft in this room.',
          action: 'visit_and_note_in_zone',
          zone_id: 'z01_sammer_workshop',
          scene_id: 'scene_d1_explore',
          icon: '🎻'
        },
        {
          id: 'd1_reflect',
          type: 'reflection',
          title: 'First Impressions',
          summary: 'Write a short reflection on your first encounter with the venue.',
          detail: 'Before the day gets busy, capture your first impressions. What surprised you? What felt familiar? What are you most curious about? Write at least a few sentences — this will be the seed of your camp journal.',
          action: 'create_note_min_length',
          min_length: 20,
          scene_id: 'scene_d1_reflect',
          icon: '✍️'
        }
      ]
    },
    {
      day: 2,
      label: 'Day Two · Light & Texture',
      missions: [
        {
          id: 'd2_main',
          type: 'main',
          title: 'Chasing Light',
          summary: 'Visit the rooftop (or any zone with natural light) and observe how light changes the space.',
          detail: 'Go to the rooftop, a room with windows, or any space where natural light enters. Spend 5 minutes watching how the light falls, shifts, and shapes what you see. Visit the zone and drop a note about what the light revealed.',
          action: 'visit_and_note_in_zone',
          zone_id: 'z05_roof',
          scene_id: 'scene_d2_main',
          icon: '🌅'
        },
        {
          id: 'd2_explore',
          type: 'exploration',
          title: 'Texture Hunt',
          summary: 'Find a spot with strong texture and describe it in a note.',
          detail: 'Find a surface with character — peeling paint, rusted metal, old wood, woven fabric. Photograph it with your words: describe its color, its feel, its history. Drop a note in any zone with your texture observation.',
          action: 'create_note_min_length',
          min_length: 30,
          scene_id: 'scene_d2_explore',
          icon: '🔍'
        },
        {
          id: 'd2_reflect',
          type: 'reflection',
          title: 'What Caught Your Eye',
          summary: 'Write about one thing that surprised you today.',
          detail: 'Reflect on the day. What image keeps coming back to you? A face, a shadow, a sound, a moment. Describe it in detail — why did it stay with you? Write a note to capture it.',
          action: 'create_note_min_length',
          min_length: 30,
          scene_id: 'scene_d2_reflect',
          icon: '💭'
        }
      ]
    },
    {
      day: 3,
      label: 'Day Three · Story & Connection',
      missions: [
        {
          id: 'd3_main',
          type: 'main',
          title: 'The Interview',
          summary: 'Visit any zone and drop a note about a question you would ask this space.',
          detail: 'Every space holds a question. If this room could speak, what would it tell you? Visit any zone and drop a note that starts with: "If these walls could talk, they would say..." Complete the thought.',
          action: 'visit_and_note_any',
          min_length: 20,
          scene_id: 'scene_d3_main',
          icon: '🎙️'
        },
        {
          id: 'd3_explore',
          type: 'exploration',
          title: 'Hidden Corners',
          summary: 'Visit a less-traveled zone — the basement, storage attic, or derelict kitchen.',
          detail: 'Some stories live in the margins. Visit the utility basement, storage attic, old kitchen, derelict bathroom, or any zone that feels hidden. Drop a note about what makes this space feel forgotten — or unforgettable.',
          action: 'visit_any_of',
          zone_ids: ['z10_storage_attic', 'z14_utility_basement', 'z04_bathroom_derelict', 'z16_kitchen_derelict'],
          min_notes: 1,
          scene_id: 'scene_d3_explore',
          icon: '🗝️'
        },
        {
          id: 'd3_reflect',
          type: 'reflection',
          title: 'The Edit',
          summary: 'Review your notes so far. Write about a pattern you notice.',
          detail: 'Look back at the notes you have dropped today. Is there a theme? A word that keeps appearing? A feeling that connects them? Write a reflection about what your own observations reveal about what matters to you as a filmmaker.',
          action: 'create_note_min_length',
          min_length: 40,
          scene_id: 'scene_d3_reflect',
          icon: '🎞️'
        }
      ]
    }
  ];

  /* ── Helpers ── */
  function loadJSON(key, fallback){
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }

  function saveJSON(key, data){
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e){}
  }

  function safeArray(v){ return Array.isArray(v) ? v : []; }

  function todayDateStr(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  /* ── Read existing app data ── */
  function readVisited(){
    return safeArray(loadJSON(VISITED_KEY, []));
  }

  function readNotes(){
    var raw = loadJSON(NOTES_KEY, { schema_version: 1, notes: [] });
    return raw && raw.notes ? safeArray(raw.notes) : [];
  }

  /* ── Mission state persistence ── */
  function loadMissionState(){
    var s = loadJSON(MISSION_KEY, null);
    if (!s) return null;
    return s;
  }

  function saveMissionState(state){
    saveJSON(MISSION_KEY, state);
  }

  function getDefaultState(){
    return {
      schema_version: 1,
      current_day: 1,
      day_started: todayDateStr(),
      missions: {}
    };
  }

  /* ── Scene persistence ── */
  function loadScenes(){
    return safeArray(loadJSON(SCENES_KEY, []));
  }

  function saveScenes(scenes){
    saveJSON(SCENES_KEY, scenes);
  }

  /* ── Ensure today's missions exist in state ── */
  function ensureTodayMissions(){
    var state = loadMissionState();
    var today = todayDateStr();

    if (state && state.day_started === today){
      return state;
    }

    if (!state || state.day_started !== today){
      state = getDefaultState();
    }

    var dayData = DAYS[state.current_day - 1] || DAYS[0];
    dayData.missions.forEach(function(m){
      if (!state.missions[m.id]){
        state.missions[m.id] = { state: STATE.AVAILABLE };
      }
    });

    saveMissionState(state);
    return state;
  }

  /* ── Check if a mission's action conditions are met ── */
  function checkAction(mission, visited, notes){
    switch (mission.action){
      case 'visit_zones':
        return visited.length >= mission.count;

      case 'visit_and_note_in_zone':
        return visited.indexOf(mission.zone_id) !== -1 &&
               notes.some(function(n){ return n.zone === mission.zone_id; });

      case 'create_note_min_length':
        return notes.some(function(n){
          var body = n.body || '';
          return body.length >= (mission.min_length || 0);
        });

      case 'visit_and_note_any':
        return visited.length >= 1 &&
               notes.some(function(n){
                 var body = n.body || '';
                 return body.length >= (mission.min_length || 0);
               });

      case 'visit_any_of':
        var zoneMatch = mission.zone_ids.some(function(zid){ return visited.indexOf(zid) !== -1; });
        return zoneMatch && notes.length >= (mission.min_notes || 1);

      case 'visit_specific':
        return visited.indexOf(mission.zone_id) !== -1;

      default:
        return false;
    }
  }

  /* ── Public API ── */

  function getAvailableDays(){
    return DAYS;
  }

  function getCurrentDay(){
    var state = ensureTodayMissions();
    return DAYS[state.current_day - 1] || DAYS[0];
  }

  function getDayScenes(dayIdx){
    var day = DAYS[dayIdx];
    if (!day) return [];
    return day.missions.map(function(m){ return SCENES[m.scene_id]; }).filter(Boolean);
  }

  function getMission(missionId){
    var state = ensureTodayMissions();
    var day = getCurrentDay();
    var def = null;
    for (var i = 0; i < day.missions.length; i++){
      if (day.missions[i].id === missionId){ def = day.missions[i]; break; }
    }
    if (!def) return null;
    var ms = state.missions[missionId] || { state: STATE.AVAILABLE, active_at: null, completed_at: null };
    return {
      def: def,
      state: ms.state,
      active_at: ms.active_at || null,
      completed_at: ms.completed_at || null,
      scene: SCENES[def.scene_id] || null
    };
  }

  function getAllMissionsWithState(){
    var state = ensureTodayMissions();
    var day = getCurrentDay();
    return day.missions.map(function(def){
      var ms = state.missions[def.id] || { state: STATE.AVAILABLE };
      return {
        def: def,
        state: ms.state,
        active_at: ms.active_at || null,
        completed_at: ms.completed_at || null,
        scene: SCENES[def.scene_id] || null
      };
    });
  }

  /* ── Activate a mission (user clicks "start" or begins related action) ── */
  function activateMission(missionId){
    var state = ensureTodayMissions();
    if (!state.missions[missionId]) return false;
    if (state.missions[missionId].state !== STATE.AVAILABLE) return false;
    state.missions[missionId].state = STATE.ACTIVE;
    state.missions[missionId].active_at = Date.now();
    saveMissionState(state);
    return true;
  }

  /* ── Check and update all mission completions ── */
  function refreshCompletions(){
    var state = ensureTodayMissions();
    var visited = readVisited();
    var notes = readNotes();
    var day = getCurrentDay();
    var changed = false;

    day.missions.forEach(function(def){
      var ms = state.missions[def.id];
      if (!ms) return;
      if (ms.state === STATE.CLAIMED || ms.state === STATE.COMPLETED) return;

      var done = checkAction(def, visited, notes);
      if (done && ms.state !== STATE.COMPLETED){
        ms.state = STATE.COMPLETED;
        ms.completed_at = Date.now();
        changed = true;
        // Auto-activate if still available
        if (ms.state === STATE.AVAILABLE){
          ms.state = STATE.ACTIVE;
          ms.active_at = Date.now();
        }
      }
    });

    if (changed) saveMissionState(state);
    return changed;
  }

  /* ── Claim a mission's scene reward ── */
  function claimMission(missionId){
    var state = ensureTodayMissions();
    var ms = state.missions[missionId];
    if (!ms) return null;
    if (ms.state !== STATE.COMPLETED) return null;

    var day = getCurrentDay();
    var def = null;
    for (var i = 0; i < day.missions.length; i++){
      if (day.missions[i].id === missionId){ def = day.missions[i]; break; }
    }
    if (!def) return null;

    var sceneData = SCENES[def.scene_id];
    if (!sceneData) return null;

    // Mark claimed
    ms.state = STATE.CLAIMED;
    saveMissionState(state);

    // Save the scene
    var scenes = loadScenes();
    var alreadyHas = scenes.some(function(s){ return s.id === sceneData.id; });
    if (!alreadyHas){
      scenes.push({
        id: sceneData.id,
        title: sceneData.title,
        narrative: sceneData.narrative,
        mission_id: missionId,
        day: state.current_day,
        unlocked_at: Date.now()
      });
      saveScenes(scenes);
    }

    return sceneData;
  }

  /* ── Get all unlocked scenes ── */
  function getUnlockedScenes(){
    return loadScenes();
  }

  /* ── Get mission completion stats ── */
  function getStats(){
    var state = ensureTodayMissions();
    var day = getCurrentDay();
    var total = day.missions.length;
    var claimed = 0;
    var completed = 0;
    var active = 0;

    day.missions.forEach(function(def){
      var ms = state.missions[def.id];
      if (!ms) return;
      if (ms.state === STATE.CLAIMED) claimed++;
      if (ms.state === STATE.COMPLETED || ms.state === STATE.CLAIMED) completed++;
      if (ms.state === STATE.ACTIVE || ms.state === STATE.COMPLETED || ms.state === STATE.CLAIMED) active++;
    });

    var allClaimed = claimed === total;
    var scenes = loadScenes();

    return {
      current_day: state.current_day,
      day_label: day.label,
      total: total,
      claimed: claimed,
      completed: completed,
      active: active,
      all_claimed: allClaimed,
      total_scenes: scenes.length
    };
  }

  /* ── Seed demo missions for first-time visitors ── */
  function seedDemo(){
    var existing = loadMissionState();
    if (existing) return false;

    var state = getDefaultState();
    state.current_day = 1;
    state.day_started = todayDateStr();

    var day = DAYS[0];
    day.missions.forEach(function(m, idx){
      var ms = { state: STATE.AVAILABLE };
      // Make first mission active (started)
      if (idx === 0){
        ms.state = STATE.ACTIVE;
        ms.active_at = Date.now() - 600000;
      }
      state.missions[m.id] = ms;
    });

    saveMissionState(state);

    // Seed one demo scene for display
    var scenes = loadScenes();
    if (scenes.length === 0){
      scenes.push({
        id: '_demo_welcome',
        title: 'Welcome to Camp',
        narrative: 'The bus pulls up to a stone building nested in olive trees. Birzeit air is dry and warm. You step out, bag over shoulder, not knowing yet what stories you will find inside. But the building knows. It has been waiting.',
        mission_id: null,
        day: 1,
        unlocked_at: Date.now() - 86400000
      });
      saveScenes(scenes);
    }

    return true;
  }

  /* ── Force advance to next day (for testing) ── */
  function advanceDay(){
    var state = loadMissionState() || getDefaultState();
    var maxDay = DAYS.length;
    state.current_day = Math.min(state.current_day + 1, maxDay);
    state.day_started = todayDateStr();
    state.missions = {};
    saveMissionState(state);
    return state.current_day;
  }

  /* ── Expose state constants ── */
  return {
    STATE: STATE,
    getAvailableDays: getAvailableDays,
    getCurrentDay: getCurrentDay,
    getDayScenes: getDayScenes,
    getMission: getMission,
    getAllMissionsWithState: getAllMissionsWithState,
    activateMission: activateMission,
    refreshCompletions: refreshCompletions,
    claimMission: claimMission,
    getUnlockedScenes: getUnlockedScenes,
    getStats: getStats,
    seedDemo: seedDemo,
    advanceDay: advanceDay,
    ZONE_NAMES: ZONE_NAMES
  };

})();
