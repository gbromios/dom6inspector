const UNITS = new Set([
  574, // Amber Clan Triton
  612, // Gryphon Rider
  633, // Werewolf
  634, // Handmaiden of Death
  636, // Basilisk
  637, // Draco Lion
  639, // Kraken King
  641, // Ancient Mandragora
  642, // Giant Lobster
  646, // Troll Raider
  647, // Dark Knight
  648, // Troll Archer
  649, // Troll Mage
  650, // Warrior Mage
  651, // Eater of Dreams
  659, // Grotesque
  672, // Spectral Velite
  673, // Spectral Hastatus
  677, // Apparition
  682, // Spectral Standard
  693, // Tomb Wyrm
  695, // Beast Illusion
  696, // Knight Illusion
  712, // Satyr Manikin
  713, // Harpy Manikin
  717, // Carrion Horse
  718, // Carrion Bear
  719, // Carrion Beast
  720, // Slave
  741, // Giant Mummy
  742, // Giant Mummy
  743, // Mummy
  750, // Thing From Beyond
  751, // Thing That Should Not Be
  752, // Elder Thing
  753, // Thing From The Void
  754, // Greater Otherness
  755, // Otherness
  756, // Lesser Otherness
  757, // Vile Thing
  758, // Thing Of Many Eyes
  759, // Dweller-In-The-Deep
  762, // Vastness
  764, // Serpent XXX
  778, // Divine Mummy
  780, // Lord of the Hunt
  799, // Imperial Footman
  816, // Shark
  843, // Shade Lord
  851, // Cu Sidhe
  870, // Captain
  871, // Pirate
  914, // Soulless Warrior
  915, // Soulless Warrior
  916, // Soulless Warrior
  917, // Soulless Warrior
  918, // Soulless Warrior
  919, // Soulless Warrior
  920, // Soulless Warrior
  921, // Soulless Warrior
  922, // Soulless Warrior
  955, // Asynja
  962, // Madman
  963, // Mad Priest
  965, // Lord of Fertility
  966, // Formless Spawn
  967, // Hybrid
  972, // Hybrid Soldier
  975, // Ichtyid Warrior
  976, // Ichtyid Lord
  993, // Slave of Belphegor
  995, // Eater of the Dead
  996, // Eater of the Dead
  997, // Unfettered
  1001, // Asmeg
  1002, // Asmeg Jarl
  1005, // Minotaur Manikin
  1006, // Carrion Behemoth
  1007, // Mad Deep One
  1008, // Fanatic Deep One
  1009, // Holy Deep One
  1032, // Royal Navigator
  1080, // XXX - Archerless Chariot
  1084, // Moose
  1087, // Large Ant
  1093, // Sagittarian Carcass
  1117, // Vanara
  1129, // Bandar
  1148, // Eater of Gods
  1149, // Eater of Gods
  1150, // Eater of Gods
  1151, // Slave to Unreason
  1179, // Serpent
  1187, // Cataphract
  1195, // Hoburg Priest
  1196, // Hog Knight
  1197, // Burgmeister
  1200, // Unfrozen Mage
  1201, // Unfrozen Lord
  1202, // Unfrozen Warrior
  1203, // Unfrozen
  1242, // Samurai
  1252, // Daimyo
  1262, // Oni
  1263, // Oni Spirit
  1268, // Kuro-Oni
  1269, // Oni Spirit
  1270, // Ronin
  1271, // Maker of Ruins
  1296, // Erinya
  1297, // Erinya
  1298, // Erinya
  1347, // Sirrush
  1364, // Jade Lizard
  1380, // Great Hawk
  1406, // Visitor
  1407, // Hunter of Heroes
  1413, // Trident Lord
  1414, // Trident Lord
  1432, // Hannya
  1454, // Unused Ancient One
  1455, // Ancient Wet One
  1514, // Lizard Shaman
  1530, // Kappa Mage
  1539, // Ghost Mage
  1540, // Ghost Mage
  1541, // Ghost Champion
  1560, // Dog
  1563, // Void Cultist
  1564, // Mad Cultist
  1566, // Mad One
  1567, // Mad Merman
  1568, // Mad Merman
  1569, // Mad Triton
  1570, // Human Dreamer
  1571, // Deep One Dreamer
  1572, // Merman Dreamer
  1573, // Merman Dreamer
  1574, // Triton Dreamer
  1575, // Hybrid Cultist
  1576, // Mad Hybrid
  1592, // Bear Tribe Warrior
  1593, // Bear Tribe Warrior
  1594, // Deer Tribe Warrior
  1595, // Deer Tribe Archer
  1596, // Wolf Tribe Shaman
  1597, // Bear Tribe Shaman
  1598, // Deer Tribe Shaman
  1600, // Lion Tribe Warrior
  1601, // Lion Tribe Archer
  1602, // Lion Tribe Witch Doctor
  1603, // Human Huskarl
  1604, // Human Huskarl
  1605, // Herse
  1610, // Jaguar Tribe Slinger
  1611, // Jaguar Tribe Warrior
  1612, // Jaguar Tribe Priest
  1616, // Caveman Champion
  1639, // Cultist
  1640, // Cultist
  1657, // Longdead Triarius
  1658, // Longdead Principe
  1659, // Tomb Charioteer
  1715, // Pisacha
  1716, // Soulless Bandar
  1717, // Soulless Bandar Warrior
  1718, // Soulless Bandar Warrior
  1719, // Longdead Bandar
  1720, // Longdead Bandar
  1721, // Longdead Bandar Warrior
  1722, // Longdead Bandar Warrior
  1723, // Longdead Raja
  1724, // Soulless Vanara
  1725, // Soulless Vanara Warrior
  1726, // Soulless Vanara Warrior
  1727, // Longdead Vanara
  1728, // Longdead Vanara Warrior
  1729, // Longdead Vanara Warrior
  1730, // Longdead Vanara Commander
  1731, // Soulless Markata
  1732, // Longdead Markata
  1836, // Ko-Oni
  1837, // Oni spirit
  1845, // Bakemono Chief
  1910, // Monster Boar
  1911, // Defiler of Dreams
  1912, // Brigand Leader
  1913, // Abomination of Desolation
  1976, // Longdead Giant
  1978, // Dust Priest
  1979, // Dust King
  2040, // Longdead Rephaite
  2041, // Longdead Rephaite
  2042, // Longdead Rephaite
  2043, // Longdead Rephaite
  2044, // Longdead Rephaite
  2046, // Malik
  2053, // Chayot
  2054, // Chayot
  2075, // Nephil
  2086, // Sleeping Pillar
  2117, // Imperial Commander
  2119, // Soulless Warrior
  2120, // Longdead
  2121, // Longdead
  2122, // Longdead Hoplite
  2123, // Longdead
  2124, // Longdead
  2141, // Ergi
  2142, // Nithing
  2143, // Werewolf
  2144, // Galdramathr
  2145, // Werewolf
  2146, // Seithberender
  2147, // Seithmathr
  2160, // Enkidu
  2194, // Draugadrott
  2195, // Flayed Bull
  2201, // Niefel Shaman
  2221, // Troll Seithberender
  2224, // Red Ant
  2232, // Large Scorpion
  2240, // Longdead Captain
  2242, // Soulless Warrior
  2243, // Soulless Warrior
  2247, // Grieving Dryad
  2263, // Mage Pilot
  2264, // Storm Caller
  2273, // Large Lobster
  2274, // Soulless Bandar Warrior
  2275, // False Prophet
  2320, // Chieftain Illusion
  2322, // XXX - Shark
  2331, // Pilgrim
  2336, // Spectral Principe
  2337, // Spectral Triarius
  2338, // Praetorian Spectre
  2339, // Shadow Triton
  2340, // Shadow Soldier
  2359, // Holy Knight
  2360, // Soldier of the Faith
  2364, // Soulless Shambler
  2365, // Soulless War Shambler
  2366, // Soulless War Shambler
  2367, // Soulless War Shambler
  2417, // Merman Priest
  2419, // Mermage
  2451, // Longdead
  2458, // Dragon Girl
  2459, // Dragon Girl
  2470, // Hybrid Commander
  2471, // Self Proclaimed Prince
  2472, // Shark Tribe Brigand
  2484, // Longdead Giant
  2488, // XXX
  2501, // Legion of Gods
  2504, // Zotz
  2505, // Camazotz
  2510, // Lava-born
  2511, // Lava-born Commander
  2513, // Cave Spider
  2522, // Released Sage
  2523, // Released King
  2524, // Released Warrior
  2525, // Released One
  2529, // Cave Drake
  2531, // Huskarl
  2532, // Herse
  2533, // Hirdman
  2534, // Dragon
  2535, // Plague Cult Leader
  2536, // Fellow
  2537, // Monk
  2538, // Noble
  2539, // Noble
  2540, // Blood Mage
  2541, // Mountain King
  2561, // Raptorian Warrior
  2562, // Fravashi
  2567, // Airya Light Infantry
  2568, // Airya Infantry
  2569, // Spire Horn Seraph
  2598, // Turan Usij
  2607, // Turan Athravan
  2618, // Renegade Harab Seraph
  2619, // Harab Seraph
  2635, // Ahu
  2638, // XXX - Turan Gryphon
  2640, // Giant Shaman
  2641, // Giant Sorcerer
  2642, // Yeti Shaman
  2673, // Xibalban Scout
  2701, // Nazcan Longdead
  2702, // Nazcan Longdead
  2703, // Caelian Longdead
  2704, // Caelian Longdead
  2705, // Caelian Longdead
  2706, // Caelian Longdead
  2707, // Soulless Nazcan
  2708, // Soulless Nazcan Warrior
  2709, // Soulless Nazcan Warrior
  2710, // Soulless Nazcan Warrior
  2711, // Soulless Nazcan Warrior
  2766, // Balam of the North
  2769, // Balam of the East
  2772, // Balam of the South
  2775, // Balam of the West
  2804, // Ichtyid Shaman
  2817, // Bone Tribe Hunter
  2818, // Bone Tribe Beast Hunter
  2819, // Bone Tribe Head Hunter
  2820, // Bone Reader
  2840, // Spectral Archer
  2841, // Spectral Peltast
  2842, // Spectral Hoplite
  2843, // Spectral Kourete
  2844, // Spectral Commander
  2857, // Fish
  2902, // Merrow Militia
  2903, // Merrow
  2904, // Merrow
  2905, // Merrow Chieftain
  2906, // Merrow Druid
  2933, // Enkidu
  2981, // Soulless Enkidu
  2982, // Soulless Warrior
  2983, // Soulless Warrior
  3004, // Serf Defender
  3005, // Longdead Archer
  3006, // Humanbred
  3007, // Bug Soul Vessel
  3012, // Shrimp Soul Vessel
  3036, // Erytheian Priest
  3037, // Erytheian Priest
  3046, // King of Both Worlds
  3047, // King of Both Worlds
  3048, // Queen of Land and Water
  3049, // Queen of Land and Water
  3062, // Hellbred Giant
  3063, // Hellbred Horite
  3065, // Marble Lion
  3067, // Spectral Lictor
  3070, // Chunari
  3075, // Little Soulless
  3077, // Morrigna
  3078, // Morrigna
  3084, // Amanojaku
  3085, // Oni Spirit
  3102, // Neodamode Peltast
  3104, // Neodamode Ekdromos
  3106, // Neodamode Hoplite
  3113, // Kryptes
  3149, // Lochos
  3150, // Gigante
  3152, // Wind Caller
  3182, // Commander
  3183, // Ekdromos
  3184, // Hoplite
  3185, // Heavy Infantry
  3186, // Commander
  3187, // Heavy Cavalry
  3188, // Heavy Infantry
  3201, // Hydrophoros of the East
  3202, // Hydrophoros of the West
  3206, // Titan of Crossroads
  3207, // Titan of Crossroads
  3214, // Iron Bound
  3229, // First of the Gigantes
  3230, // King of the Gigantes
  3232, // Iron Fly
  3237, // Sinister Hawk
  3243, // Disciple of Myrddin
  3274, // Vampire Count
  3276, // Cynocephalian Hunter
  3277, // Cynocephalian Warrior
  3278, // Cynocephalian Chieftain
  3279, // Cynocephalian Shaman
  3292, // Azenach Archer
  3293, // Cannibal Warrior
  3294, // Agrimandri Warrior
  3295, // Fommepori Warrior
  3296, // Vintefolei Horseman
  3309, // XXX
  3360, // Longdead
  3361, // Longdead
  3362, // Piconye Castellan
  3377, // Prester King
  3383, // Yllerion
  3390, // Hoburg Slinger
  3391, // Hoburg Spearman
  3392, // Hoburg Pikeman
  3393, // Hoburg Defender
  3451, // Necrodai
  3452, // Necrodai
  3500, // Test Gygja
  3501, // Test Soldier
  3510, // Orchard of Souls
  3524, // Unicorn
  3525, // Armored Unicorn
  3530, // Great Mouflon
  3538, // Camel
  3543, // * Behemoth
  3544, // Gryphon
  3547, // Tiger
  3548, // Armored Tiger
  3549, // Sacred Tiger
  3552, // * Armored Moose
  3562, // Skeletal Beast
  3564, // Chariot
  3577, // Steppe Horse
  3578, // Armored Steppe Horse
  3579, // Armored Steppe Horse
  3637, // Captain Illusion
  3643, // Elephant Spearman
  3659, // Homunculus
  3669, // Nidadrott
  3722, // Air Elemental
  3730, // Water Elemental
  3738, // Earth Elemental
  3746, // Ice Elemental
  3754, // Illearth
  3832, // Divine Hero
  3833, // Divine Sibyl
  3834, // Divine Daughter
  3835, // Divine Son
  3836, // Bekryde
  3837, // Bekryde
  3838, // Bekryde Warrior
  3839, // Bekryde Champion
  3851, // Carrion Commander
  3852, // Void Dreamer
  3853, // Void Herald
  3871, // Longdead Zotz
  3872, // Longdead Zotz
  3873, // Soulless Zotz
  3896, // Soulless Warrior
  3983, // Phantasmal Sea Dog
  3984, // Phantasmal Triton
  3985, // Phantasmal Knight
  3990, // Void Flame
  3994, // Armored Kelpie
  3995, // Armored Kelpie
]);



export const INDIES = new Set([
  8, // Elephant Spearman
  10, // Projection
  17, // Archer
  18, // Militia
  19, // Heavy Cavalry
  20, // Heavy Cavalry
  21, // Heavy Cavalry
  24, // Light Cavalry
  25, // Light Cavalry
  26, // Light Cavalry
  28, // Light Infantry
  29, // Light Infantry
  30, // Militia
  31, // Militia
  32, // Archer
  33, // Archer
  34, // Commander
  35, // Commander
  36, // Commander
  38, // Heavy Infantry
  39, // Heavy Infantry
  40, // Heavy Infantry
  44, // Mounted Commander
  45, // Mounted Commander
  47, // Crossbowman
  48, // Crossbowman
  49, // Crossbowman
  55, // Longbowman
  91, // Heavy Cavalry
  118, // War Master
  121, // Demonbred
  123, // Wolf Tribe Archer
  124, // Wolf Tribe Warrior
  125, // Woodsman Blowpipe
  126, // Woodsman
  136, // Horse Tribe Chief
  137, // Horse Tribe Cavalry
  155, // Velite
  174, // Triton
  175, // Triton Guard
  176, // Triton
  182, // Wraith Lord
  205, // Raptor
  252, // Harab Seraph
  285, // Spearman
  286, // Maceman
  287, // Swordsman
  288, // Heavy Crossbowman
  289, // Pikeneer
  290, // Crossbowman
  291, // Captain
  292, // Heavy Cavalry
  293, // Captain
  295, // Sacred Serpent
  302, // Wizard of High Magics
  321, // Lizard Shaman
  324, // Dwarf Elder
  327, // Anathemant
  328, // Lizard King
  334, // Golden Naga
  346, // Crystal Sorceress
  347, // Crystal Priestess
  348, // Amazon
  349, // Garnet Sorceress
  350, // Garnet Priestess
  351, // Amazon
  352, // Jade Sorceress
  353, // Jade Priestess
  354, // Amazon
  355, // Onyx Sorceress
  356, // Onyx Priestess
  357, // Amazon
  367, // Pegasus Rider
  369, // Nightmare Rider
  370, // Jade Maiden
  374, // Queen Mother
  415, // High Seraph
  416, // Seraphine
  423, // Lizard Warrior
  427, // Spy
  542, // Stone Monstra
  548, // Hoburg Hero
  4012, // Vaetti Archer
  4013, // Elephant Archer
  4014, // Chariot Archer
  4015, // Mammoth Archer
  4016, // Chariot Archer
  4017, // Elephant Archer
  4018, // Elephant Archer
  4019, // Elephant Archer
]);


export const FREESPAWN = new Set([

])

export const UNDEAD = new Set([
  536, // Longdead Buccaneer
  547, // Dead One
  184, // Knight of the Unholy Sepulchre
  186, // Longdead Velite
  190, // Mound King
  191, // Longdead
  192, // Longdead
  193, // Longdead
  194, // Longdead
  195, // Longdead
  315, // Soulless Giant
  316, // Longdead Giant
  317, // Soulless
  319, // Soulless of C'tis
  398, // Mummy
  408, // Deer Carcass
  392, // Ashen Angel // event guy?
  613, // Longdead Admiral
  615, // Longdead of C'tis
  616, // Longdead of C'tis
  617, // Longdead of C'tis

  624, // Old King
])

export const DEBUGGERS = new Set([
  4024, // Debug Senpai
  4025, // Debug Kohai
]);

  // unused?
export const NO_IDEA = new Set([

  623, // King of the World (horror???)
  368, // Gryphon - XXX
  554, // Ermorian Cultist // event?
  382, // Mystic
  295, // Sacred Serpent (ctis?)
  542, // Stone Monstra
  543, // Angel XXX old angelic host summon?
  368, // Gryphon - XXX

  // pretty sure these are just summons from `nextspell`s
  182, // Wraith Lord (isnt there a spell?)
  3906, // Unseelie Soldier
  3907, // Unseelie Knight
  3909, // Unseelie Prince
  3912, // Fay Folk
  3913, // Fay Folk
  3914, // Fay Folk
  3915, // Fay Folk
  3916, // Fay Folk
  3917, // Fay Folk
  3997, // Queen of Winter (PRETENDER???)
])

export const ANIMALS = new Set([
  4, // Serpent
  591, // Dragonfly
  410, // Giant Rat
  4000, // Horse (like a generic mount?)
])

export const HORRORS = new Set([
  307, // Lesser Horror
  308, // Horror
  2209, // Horror Mantis
  2210, // Float Cat Horror
  2211, // Mind Slime Horror
  2212, // Soultorn
  2213, // Gore Tide Horror
  2214, // Spine Membrane Horror
  2215, // Belly Maw Horror
  2216, // Brass Claw Horror
])
