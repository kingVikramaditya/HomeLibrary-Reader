/**
 * HomeLibrary - Books Data Store
 * Contains the 14 books from the original Dribbble concept UI
 * with full metadata, covers, and real readable content chapters.
 */

const DEFAULT_BOOKS = [
  // --- MOST POPULAR (ROW 1) ---
  {
    id: "a_poem_for_every_night",
    title: "A Poem for Every Night of the Year",
    author: "Allie Esiri",
    cover: "assets/covers/a_poem_for_every_night.png",
    rating: 5,
    reviewsCount: 1420,
    genre: "Fiction",
    subGenres: ["Poetry", "Literature", "Anthology"],
    pages: 432,
    format: "EPUB",
    language: "English",
    published: "2016",
    readingTime: "5h 20m",
    shelf: "popular",
    progress: 35,
    currentPage: 152,
    isFavorite: true,
    synopsis: "A Poem for Every Night of the Year is a magnificent collection of 366 poems compiled by Allie Esiri, with one for every night of the year, including leap years. From William Shakespeare and Christina Rossetti to Maya Angelou and Kate Tempest, this journey through the seasons invites reflection, comfort, and wonder before drifting off to sleep.",
    chapters: [
      {
        title: "Autumn Solstice: October Nocturnes",
        content: `<h3>October Nocturne</h3>
<p><em>By Allie Esiri & Classical Poets</em></p>
<p>The amber leaf drifts slow upon the stream,<br>
A golden boat upon a glass of night;<br>
The world surrenders gently to a dream,<br>
And stars ignite their cold, celestial light.</p>
<p>The harvest moon hangs heavy in the sky,<br>
A lantern for the traveler on the road;<br>
The owl repeats its melancholy cry,<br>
While silver frost descends on our abode.</p>
<br>
<h3>The Quiet Hour</h3>
<p>When shadows lengthen on the quiet hearth,<br>
And books lie open by the embers' glow,<br>
We leave behind the clamor of the earth,<br>
And listen to the secret winds that blow.</p>
<p>For in the silence of the velvet deep,<br>
The heart remembers what the day forgot:<br>
That peace is not a slumber or a sleep,<br>
But stillness resting in a sacred spot.</p>`
      },
      {
        title: "Winter Whispers: December Frost",
        content: `<h3>December Frost</h3>
<p>The breath of winter paints the windowpane,<br>
With ferns of ice and feathers made of frost;<br>
The sleeping earth forgets the summer rain,<br>
And counts no petal or green meadow lost.</p>
<p>Sleep now, weary mind, beneath the fleece,<br>
The universe is watching through the pane;<br>
Tomorrow brings its gentle gift of peace,<br>
When morning sunlight turns the white to gold again.</p>`
      },
      {
        title: "Midnight Melodies",
        content: `<h3>Midnight Melodies</h3>
<p>Stars across the ocean ceiling,<br>
Cast their shimmer on the tide;<br>
Every gentle rhythm healing,<br>
Where the restless spirits hide.</p>
<p>Close your eyes, the clock is chiming,<br>
Twelve slow bells into the dark;<br>
All the universe is rhyming,<br>
Guided by a single spark.</p>`
      }
    ]
  },
  {
    id: "sawkill_girls",
    title: "Sawkill Girls",
    author: "Claire Legrand",
    cover: "assets/covers/sawkill_girls.png",
    rating: 4,
    reviewsCount: 890,
    genre: "Young Adult Fiction",
    subGenres: ["Horror Fiction", "Mystery", "Thriller"],
    pages: 464,
    format: "PDF",
    language: "English",
    published: "2018",
    readingTime: "7h 10m",
    shelf: "popular",
    progress: 15,
    currentPage: 70,
    isFavorite: false,
    synopsis: "Beware of the woods and the dark waters. On the lush, fog-shrouded island of Sawkill Rock, stories of missing girls have circulated for decades, passed down in hushed whispers. Three girls—Marion, Zoey, and Val—find their lives irrevocably entwined as an ancient, monstrous force hungers beneath the island soil.",
    chapters: [
      {
        title: "Chapter 1: The Island of Fog",
        content: `<h1>Chapter 1: The Island of Fog</h1>
<p>Sawkill Rock was an island of cold granite, wild black brambles, and evergreen woods that smelled perpetually of damp soil and sea pine. For decades, girls had been disappearing into its shadows, swallowed without a single trace.</p>
<p>Marion Dover stood at the bow of the ferry, feeling the freezing sea spray prickle her cheeks. After the tragic car crash that had claimed her father, she, her mother, and her older sister Charlotte had moved to this isolated sanctuary to start over. Or at least, that was the story their mother kept repeating through forced smiles.</p>
<p>Yet as the island’s jagged cliffs emerged from the emerald mist, Marion felt a strange electric vibration beneath her sternum. The island was alive. And something ancient was watching them from the woods with hungry golden eyes.</p>`
      },
      {
        title: "Chapter 2: The Collector",
        content: `<h1>Chapter 2: The Collector</h1>
<p>In the grand Victorian manor perched above the cliffs, Val Mortimer combed her long golden hair before an ornate gilded mirror. To everyone at Sawkill High, she was the untouchable queen—wealthy, poised, and beautiful.</p>
<p>Nobody knew the monster she served in the deep cavern beneath the estate foundation. A beast that whispered through the floorboards at midnight: <em>Bring me another.</em></p>
<p>Val looked down at her shaking hands. The dark power of the island pulsed beneath her skin like venom. She had protected herself this long by obeying. But with the new girls arriving, obedience felt like suicide.</p>`
      },
      {
        title: "Chapter 3: The Secret in the Pines",
        content: `<h1>Chapter 3: The Secret in the Pines</h1>
<p>Zoey ran through the forest path, her sneakers kicking up damp pine needles. Her flashlight beam flickered, cutting through the swirling coastal mist.</p>
<p>She knew what had happened to her best friend last autumn. The police had called it a runaway case, but Zoey had found the scratched initials on the oak trunk deep in the forbidden preserve. She stopped, catching her breath, and heard the soft sound of singing coming from inside the rock crevice.</p>`
      }
    ]
  },
  {
    id: "dancing_with_the_tiger",
    title: "Dancing with the Tiger",
    author: "Lili Wright",
    cover: "assets/covers/dancing_with_the_tiger.png",
    rating: 5,
    reviewsCount: 1104,
    genre: "Thriller",
    subGenres: ["Mystery", "Genre Fiction", "Suspense"],
    pages: 320,
    format: "DOCX",
    language: "English",
    published: "2016",
    readingTime: "5h 45m",
    shelf: "popular",
    progress: 0,
    currentPage: 1,
    isFavorite: false,
    synopsis: "Set in Oaxaca, Mexico, Dancing with the Tiger is a pulse-pounding literary thriller about the hunt for a priceless pre-Columbian jade death mask belonging to Montezuma. Anna Ramsay travels to Mexico to track down the relic and save her disgraced father, only to become entangled with drug lords, art forgers, and ruthless collectors.",
    chapters: [
      {
        title: "Chapter 1: The Mask of Montezuma",
        content: `<h1>Chapter 1: The Mask of Montezuma</h1>
<p>The tropical heat in Oaxaca clung to the skin like steam from a boiling kettle. Anna Ramsay pressed her thumb against the cool amber beads of her grandmother's necklace, watching the shadows stretch across the cobblestone zócalo.</p>
<p>Somewhere in the hills above the colonial city, a priceless death mask crafted from pure green jade had been excavated from an unmapped Zapotec tomb. Her father, an eccentric retired art history professor in New York, had gambled everything on the rumor.</p>
<p><em>"Find the tiger mask, Anna,"</em> he had pleaded over a crackling telephone line three nights before his sudden disappearance. <em>"It isn't merely gold and jade. It is the missing heart of a forgotten empire."</em></p>`
      },
      {
        title: "Chapter 2: Shadows in the Market",
        content: `<h1>Chapter 2: Shadows in the Market</h1>
<p>The Mercado 20 de Noviembre was a sensory overload of roasted chili smoke, woven wool tapestries, and hand-carved copal animals. Anna moved swiftly through the crowded aisles, keeping her sunglasses low.</p>
<p>Behind her, footsteps matched her pace. A tall man in a dark linen suit paused beside a vendor selling silver filigree. When Anna turned, he tipped his Panama hat and smiled—a predator acknowledging prey.</p>`
      }
    ]
  },
  {
    id: "a_teaspoon_of_earth_and_sea",
    title: "A Teaspoon of Earth & Sea",
    author: "Dina Nayeri",
    cover: "assets/covers/a_teaspoon_of_earth_and_sea.png",
    rating: 3,
    reviewsCount: 642,
    genre: "Novel",
    subGenres: ["Fiction", "Romance Novel", "Historical"],
    pages: 448,
    format: "TXT",
    language: "English",
    published: "2013",
    readingTime: "6h 50m",
    shelf: "popular",
    progress: 55,
    currentPage: 246,
    isFavorite: false,
    synopsis: "Set in a seaside village in northern Iran in the 1980s, eleven-year-old Saba Hafezi loses her mother and twin sister, Mahtab, under mysterious circumstances. Convinced her sister escaped to America, Saba reconstructs an imaginative Western life for Mahtab, while navigating love, storytelling, and survival in post-revolutionary Iran.",
    chapters: [
      {
        title: "Chapter 1: The Shores of Gilan",
        content: `<h1>Chapter 1: The Shores of Gilan</h1>
<p>Growing up in the northern province of Gilan by the Caspian Sea, Saba Hafezi knew that life was divided into two halves: the world that existed before the revolution, and the world that came after.</p>
<p>Her twin sister, Mahtab, had vanished into the turquoise waves when they were eleven years old, or so everyone in their small seaside town whispered. Yet Saba clung to an unshakeable belief. She imagined another version of their lives unfolding across the ocean in America, where girls rode bicycles with ribbons in their hair, ate cherries in tall glass sundaes, and read forbidden books under the warm sun without fear.</p>`
      },
      {
        title: "Chapter 2: The Memory of Water",
        content: `<h1>Chapter 2: The Memory of Water</h1>
<p>Every story Saba told herself had two endings. In one, her mother had boarded an airplane heading west, holding Mahtab by the hand. In the other, the dark current of the sea had swallowed their secrets whole.</p>
<p>Her father, a quiet man who tended his tea plantation with weathered hands, rarely spoke of that fateful July afternoon. "Memory is not a museum, Saba," he would say, stirring black tea with a cardamom pod. "It is living soil. What you plant inside it will either nourish you or drown your roots."</p>`
      }
    ]
  },
  {
    id: "feder_welt",
    title: "Feder Welt",
    author: "Laura Newman",
    cover: "assets/covers/feder_welt.png",
    rating: 4,
    reviewsCount: 780,
    genre: "Fantasy",
    subGenres: ["Fiction", "Young Adult Fiction", "Mythology"],
    pages: 384,
    format: "EPUB",
    language: "German / English",
    published: "2017",
    readingTime: "6h 15m",
    shelf: "popular",
    progress: 0,
    currentPage: 1,
    isFavorite: false,
    synopsis: "Feder Welt plunges into an enchanted, perilous realm where avian spirits and human lineages interlock. As the crimson trees shed their feather-shaped leaves, a young girl discovers her wings are not merely a blessing from the skies, but the key to averting an impending war between mortals and the winged elders.",
    chapters: [
      {
        title: "Chapter 1: The Crimson Canopy",
        content: `<h1>Chapter 1: The Crimson Canopy</h1>
<p>The scarlet forest of Waldschatten whispered as the autumn breeze gathered strength. Every tree in this ancient grove was crowned with leaves shaped like falcon feathers, rustling with an uncanny musical cadence.</p>
<p>Klara knelt by the riverbank, her fingers tracing the reflection of the sky. From her shoulder blades, two small scars began to glow with a faint, iridescent violet luminescence. The prophecy of the Feathered Realm was awakening, and the hunters from the iron city were already crossing the bridge.</p>`
      },
      {
        title: "Chapter 2: Wings of Ash",
        content: `<h1>Chapter 2: Wings of Ash</h1>
<p>She climbed the watchtower as the first bell tolled across the valley. Below, banner flags of black and bronze billowed against the dusk. The time for hiding had passed; Klara drew her bow, unfurled her wings, and embraced the tempest.</p>`
      }
    ]
  },
  {
    id: "the_keeper_of_lost_things",
    title: "The Keeper of Lost Things",
    author: "Ruth Hogan",
    cover: "assets/covers/the_keeper_of_lost_things.png",
    rating: 4,
    reviewsCount: 2150,
    genre: "Fiction",
    subGenres: ["Romance Novel", "Novel", "Feel-Good"],
    pages: 304,
    format: "PDF",
    url: "assets/sample-books/The_Keeper_of_Lost_Things.pdf",
    language: "English",
    published: "2017",
    readingTime: "4h 50m",
    shelf: "popular",
    progress: 80,
    currentPage: 243,
    isFavorite: true,
    synopsis: "Anthony Peardew is the keeper of lost things. Forty years ago, he carelessly lost a keepsake from the love of his life, Therese. To atone, he spent his remaining decades rescuing lost objects from parks, trains, and streets. Upon his death, he leaves his house and quest to his assistant Laura, setting off a poignant journey of healing, redemption, and serendipity.",
    chapters: [
      {
        title: "Chapter 1: Padua",
        content: `<h1>Chapter 1: Padua</h1>
<p>Anthony Peardew was the keeper of lost things. For forty years he had rescued abandoned items from trains, cafes, and parks: a jigsaw piece, a single blue knitted glove, a brass door key, a bone hairclip, and a biscuit tin filled with black-and-white family photographs.</p>
<p>Each was carefully cataloged with the date and place where it was found, waiting for the day they might be reunited with their rightful owners. Anthony believed that every lost item carried the lingering soul of its keeper, waiting for grace.</p>`
      },
      {
        title: "Chapter 2: The Inheritance",
        content: `<h1>Chapter 2: The Inheritance</h1>
<p>Laura sat in the sunny drawing room of Padua, tears blurring her vision as she read Anthony's handwritten will. He had left her the grand Victorian home, the blooming rose garden, and his entire collection of four thousand lost objects.</p>
<p><em>"Dearest Laura,"</em> the letter concluded. <em>"I leave you my life's unfinished symphony. Find their homes, and in doing so, you will find your own."</em></p>`
      }
    ]
  },
  {
    id: "the_catcher_in_the_rye",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    cover: "assets/covers/the_catcher_in_the_rye.png",
    rating: 4,
    reviewsCount: 5400,
    genre: "Novel",
    subGenres: ["Fiction", "Classic Fiction", "Young Adult Fiction"],
    pages: 240,
    format: "TXT",
    language: "English",
    published: "1951",
    readingTime: "3h 40m",
    shelf: "popular",
    progress: 0,
    currentPage: 1,
    isFavorite: true,
    synopsis: "The quintessential American coming-of-age novel, The Catcher in the Rye follows sixteen-year-old Holden Caulfield over three tumultuous December days in New York City after being expelled from his prep school. Salinger's masterpiece explores alienation, innocence, phoniness, and the profound ache of growing up.",
    chapters: [
      {
        title: "Chapter 1",
        content: `<h1>Chapter 1</h1>
<p>If you really want to hear about it, the first thing you'll probably want to know is where I was born, and what my lousy childhood was like, and how my parents were occupied and all before they had me, and all that David Copperfield kind of crap, but I don't feel like going into it, if you want to know the truth.</p>
<p>Where I want to start telling is the day I left Pencey Prep. Pencey Prep is this school that's in Agerstown, Pennsylvania. You probably heard of it. You've probably seen the ads, anyway. They advertise in about a thousand magazines, always showing some hot-shot guy on a horse jumping over a fence.</p>`
      },
      {
        title: "Chapter 2",
        content: `<h1>Chapter 2</h1>
<p>Old Spencer had this room out near the infirmary. I ran all the way to his house on Anthony Wayne Avenue, freezing my rear off because I left my polo coat in the dorm and only had my red hunting hat on. I wore it with the peak swung around to the back. It looked pretty crazy, but I liked it that way.</p>`
      }
    ]
  },

  // --- RECOMMENDED (ROW 2) ---
  {
    id: "the_mists_in_winter",
    title: "The Mists in Winter",
    author: "Judith Merkle Riley",
    cover: "assets/covers/the_mists_in_winter.png",
    rating: 5,
    reviewsCount: 934,
    genre: "Science Fiction",
    subGenres: ["Fantasy", "Fiction", "Historical"],
    pages: 352,
    format: "PDF",
    language: "English",
    published: "2014",
    readingTime: "5h 30m",
    shelf: "recommended",
    progress: 20,
    currentPage: 70,
    isFavorite: false,
    synopsis: "A hauntingly evocative tale set amid the snow-draped moors of northern England. Margaret of Blackwood is blessed—or cursed—with visions that appear in the winter fog. When a charismatic scholar arrives seeking an ancient grimoire hidden in the abbey ruins, their fates intertwine in a web of forbidden alchemy and deep devotion.",
    chapters: [
      {
        title: "Chapter 1: The White Frost",
        content: `<h1>Chapter 1: The White Frost</h1>
<p>The frost had settled upon the moors three weeks before the feast of Saint Jude. In the Great Hall of Blackwood Manor, peat fires hissed against the chimney stones, sending curls of sweet, gray smoke toward the high oak rafters.</p>
<p>Margaret stood by the arched leaded window, watching the mist roll across the valley like a ghostly sea. When the fog grew thick enough, the trees ceased to be trees. They became silhouettes of forgotten knights, waiting for a horn that would never blow.</p>`
      },
      {
        title: "Chapter 2: The Stranger at the Gate",
        content: `<h1>Chapter 2: The Stranger at the Gate</h1>
<p>A single rider emerged from the vapor at dusk. His black cloak was dusted with powdered snow, and the horse he rode was lean and winded. Margaret felt the cold air rush into the courtyard as the heavy iron gates swung open.</p>`
      }
    ]
  },
  {
    id: "the_girl_who_could_see",
    title: "The Girl Who Could See",
    author: "Kara Swanson",
    cover: "assets/covers/the_girl_who_could_see.png",
    rating: 4,
    reviewsCount: 1250,
    genre: "Young Adult Fiction",
    subGenres: ["Science Fiction", "Fantasy", "Mystery"],
    pages: 290,
    format: "EPUB",
    language: "English",
    published: "2018",
    readingTime: "4h 25m",
    shelf: "recommended",
    progress: 42,
    currentPage: 122,
    isFavorite: true,
    synopsis: "All Fern wants is to be normal. But for twelve years, she has seen creatures made of shadow and light that no one else can perceive. Labeled schizophrenic and medicated into numbness, Fern begins to question her reality when a boy from her visions appears in the flesh, warning her that the shadows are preparing to hunt.",
    chapters: [
      {
        title: "Chapter 1: Monsters in the Neon",
        content: `<h1>Chapter 1: Monsters in the Neon</h1>
<p>They lived in the spaces between streetlights. Fern counted five of them clinging to the fire escape outside her apartment window, their elongated silhouettes shimmering with static electricity like bad television reception.</p>
<p>She swallowed her orange prescription capsule with cold tap water, waiting for the chemical fog to dull her sight. The doctors said they were hallucinations born from childhood trauma. But hallucinations didn't leave scorch marks on the fire escape bricks.</p>`
      },
      {
        title: "Chapter 2: The Boy of Sparks",
        content: `<h1>Chapter 2: The Boy of Sparks</h1>
<p>In the crowded subway car on the Blue Line, a boy with unruly amber hair sat across from her. When the train plunged into the tunnel and the lights flickered, sparks danced along the cuffs of his denim jacket. He caught her staring—and mouthed three words: <em>Don't look away.</em></p>`
      }
    ]
  },
  {
    id: "river_of_broken_glass",
    title: "River of Broken Glass",
    author: "Christine Finlayson",
    cover: "assets/covers/river_of_broken_glass.png",
    rating: 5,
    reviewsCount: 615,
    genre: "Mystery",
    subGenres: ["Thriller", "Genre Fiction", "Suspense"],
    pages: 312,
    format: "DOCX",
    language: "English",
    published: "2019",
    readingTime: "4h 55m",
    shelf: "recommended",
    progress: 0,
    currentPage: 1,
    isFavorite: false,
    synopsis: "In the rain-drenched coastal forests of Oregon, wildlife biologist Kelly Shannon is surveying elk herds when she discovers shards of antique Venetian glass scattered along an isolated riverbed. The discovery leads to an unsolved murder case from twenty years earlier—and puts Kelly directly in the crosshairs of a ruthless syndicate.",
    chapters: [
      {
        title: "Chapter 1: The Gorge",
        content: `<h1>Chapter 1: The Gorge</h1>
<p>The Nehalem River rushed swollen and brown beneath the November downpour. Kelly Shannon crouched on the muddy gravel bar, water dripping from the brim of her rain hat, carefully picking up a shard of cobalt-blue glass that caught the faint afternoon light.</p>
<p>It was blown glass, paper-thin and exquisitely decorated with gold leaf filigree. Nothing like this belonged twenty miles deep in the temperate rainforest. When she turned the shard over, she noticed the deep crimson stain baked into the fractured edge.</p>`
      },
      {
        title: "Chapter 2: Cold Water",
        content: `<h1>Chapter 2: Cold Water</h1>
<p>Back at the ranger station, Kelly laid out seven pieces under the magnifying lamp. The fragments reassembled into part of a crest—a winged lion with a broken sword. The symbol of the Aldobrandini estate, which had burned to ashes in 1998 along with its eccentric master.</p>`
      }
    ]
  },
  {
    id: "tell_me_youre_mine",
    title: "Tell Me You're Mine",
    author: "Elisabeth Norebäck",
    cover: "assets/covers/tell_me_youre_mine.png",
    rating: 4,
    reviewsCount: 1680,
    genre: "Thriller",
    subGenres: ["Mystery", "Fiction", "Psychological"],
    pages: 336,
    format: "TXT",
    language: "English",
    published: "2017",
    readingTime: "5h 15m",
    shelf: "recommended",
    progress: 90,
    currentPage: 302,
    isFavorite: true,
    synopsis: "A gripping psychological thriller of motherhood, grief, and obsession. Stella Widstrand is a psychotherapist with a seemingly idyllic life in Stockholm. But twenty years ago, her baby daughter disappeared at the beach and was presumed drowned. When a new young client walks into Stella's office, Stella becomes convinced: this girl is her missing daughter.",
    chapters: [
      {
        title: "Chapter 1: The Consultation",
        content: `<h1>Chapter 1: The Consultation</h1>
<p>The grandfather clock in Stella Widstrand’s consultation office ticked with measured gravity. Outside, rain tapped against the tall Scandinavian glass. The door opened, and a young woman in her twenties stepped inside, shaking raindrops from an oversized wool coat.</p>
<p>"Hello," the girl said, her voice soft and melodious. "I’m Isabelle."</p>
<p>Stella froze. The world seemed to stop on its axis. The girl's eyes were a startling, unmistakable shade of amber-green. The curve of her cheekbone, the faint dimple near her left lip—it was like looking into a mirror of herself at twenty.</p>`
      },
      {
        title: "Chapter 2: The Spiral",
        content: `<h1>Chapter 2: The Spiral</h1>
<p>Over the next fifty minutes, Isabelle spoke of her studies in literature, her strained relationship with her foster mother, and the recurring nightmares she had of cold seawater and pine dunes. Every word felt like an arrow through Stella’s heart. The voice inside her head grew into a deafening shout: <em>She survived. Alice is alive.</em></p>`
      }
    ]
  },
  {
    id: "the_immortalists",
    title: "The Immortalists",
    author: "Chloe Benjamin",
    cover: "assets/covers/the_immortalists.png",
    rating: 5,
    reviewsCount: 3820,
    genre: "Novel",
    subGenres: ["Fiction", "Romance Novel", "Historical"],
    pages: 352,
    format: "EPUB",
    language: "English",
    published: "2018",
    readingTime: "5h 40m",
    shelf: "recommended",
    progress: 10,
    currentPage: 35,
    isFavorite: false,
    synopsis: "If you knew the exact date of your death, how would you live your life? In 1969 New York City, four Gold children sneak out to visit a mysterious psychic who tells each of them the exact day they will die. The book follows Simon, Klara, Daniel, and Varya over five decades as the prophecy shapes their passions, secrets, and destinies.",
    chapters: [
      {
        title: "Chapter 1: The Lower East Side, 1969",
        content: `<h1>Chapter 1: The Lower East Side, 1969</h1>
<p>The rumor of the psychic woman on Hester Street traveled among the neighborhood children like summer measles. It was said she was a traveling mystic from Eastern Europe who looked into your palm and told you the exact day you were going to die.</p>
<p>It was July, sticky and suffocating, and the Gold children—thirteen-year-old Varya, eleven-year-old Daniel, nine-year-old Klara, and seven-year-old Simon—pooled their allowances to pay her four dollars. They climbed the dark stairwell of the tenement, their hearts beating in their throats.</p>`
      },
      {
        title: "Chapter 2: The Prophecy",
        content: `<h1>Chapter 2: The Prophecy</h1>
<p>The woman’s apartment smelled of burnt sage and dried cabbage. She took Simon into the back room first. When he emerged five minutes later, his face was as white as printer paper. He refused to say a single word until they reached the sidewalk below.</p>`
      }
    ]
  },
  {
    id: "ill_be_your_blue_sky",
    title: "I'll Be your Blue Sky",
    author: "Marisa de los Santos",
    cover: "assets/covers/ill_be_your_blue_sky.png",
    rating: 5,
    reviewsCount: 1490,
    genre: "Romance Novel",
    subGenres: ["Novel", "Fiction", "Feel-Good"],
    pages: 320,
    format: "PDF",
    language: "English",
    published: "2018",
    readingTime: "5h 05m",
    shelf: "recommended",
    progress: 60,
    currentPage: 192,
    isFavorite: true,
    synopsis: "On the eve of her wedding to a man who seems perfect on paper, Clare Hobbes meets Edith, an elderly woman whose warmth and sharp insight convince Clare to break off the wedding. When Edith passes away soon after, she bequeaths Clare an old house on coastal Delaware filled with mysteries and decades of untold love stories.",
    chapters: [
      {
        title: "Chapter 1: The Wedding Eve",
        content: `<h1>Chapter 1: The Wedding Eve</h1>
<p>The rehearsal dinner was unfolding in an explosion of white hydrangeas and crystal flutes at the country club. Zach looked handsome, triumphant, and poised for the partner track at his firm. Everyone said Clare was the luckiest woman in Philadelphia.</p>
<p>Yet standing in the garden by the stone fountain, Clare couldn't breathe. That was when an elderly woman with silver hair tucked into an emerald silk scarf walked over, offered her a mint, and said: <em>"Darling, you look like someone stepping onto the scaffold, not the altar."</em></p>`
      },
      {
        title: "Chapter 2: Blue Sky House",
        content: `<h1>Chapter 2: Blue Sky House</h1>
<p>Three months later, Clare drove down Route 1 toward the Delaware shore. The key in her handbag belonged to a rambling cedar-shingle cottage overlooking the salt marsh. Edith was gone, but her voice echoed in every breeze: <em>Live bravely, Clare. The sky is yours.</em></p>`
      }
    ]
  },
  {
    id: "something_in_the_water",
    title: "Something in the Water",
    author: "Catherine Steadman",
    cover: "assets/covers/something_in_the_water.png",
    rating: 4,
    reviewsCount: 2950,
    genre: "Thriller",
    subGenres: ["Mystery", "Crime", "Suspense"],
    pages: 352,
    format: "DOCX",
    language: "English",
    published: "2018",
    readingTime: "5h 35m",
    shelf: "recommended",
    progress: 0,
    currentPage: 1,
    isFavorite: false,
    synopsis: "Erin is a documentary filmmaker on the brink of a professional breakthrough; Mark is a handsome investment banker with a bright future. On their dream honeymoon in Bora Bora, scuba diving in the azure lagoon, they discover something floating in the water: a submerged bag containing millions in cash and diamonds. Their decision to keep it triggers a deadly domino effect.",
    chapters: [
      {
        title: "Chapter 1: The Trench",
        content: `<h1>Chapter 1: The Trench</h1>
<p>Have you ever wondered how long it takes to dig a grave? I know the answer now. It takes about four hours and thirty-five minutes in damp earth, if you don't stop, and if you don't look at what is waiting in the tarp beside you.</p>
<p>Three weeks ago, Mark and I were sipping champagne on an overwater bungalow in Bora Bora, our bare feet dangling in turquoise water that looked like melted glass. We had our whole lives planned. And then we found the bag.</p>`
      },
      {
        title: "Chapter 2: Scuba Reef",
        content: `<h1>Chapter 2: Scuba Reef</h1>
<p>The reef dropped off into an abyss of indigo blue. Through my dive mask, thirty feet below, a crumpled aluminum wreckage rested against the coral shelf. Beside it was a waterproof duffel bag, tethered to a red emergency beacon that was blinking its dying light.</p>`
      }
    ]
  },
  {
    id: "bhagavad_gita",
    title: "श्रीमद्भगवद्गीता (Bhagavad Gita)",
    author: "महर्षि वेदव्यास (Vyāsa)",
    cover: "assets/covers/the_mists_in_winter.png",
    rating: 5,
    reviewsCount: 4500,
    genre: "Sanskrit & Classics",
    subGenres: ["Sanskrit", "Philosophy", "Vedanta", "Sacred Classics"],
    pages: 700,
    format: "EPUB",
    language: "Sanskrit",
    published: "Ancient Classics",
    readingTime: "12h 00m",
    shelf: "popular",
    progress: 10,
    currentPage: 1,
    isFavorite: true,
    synopsis: "श्रीमद्भगवद्गीता सनातन धर्मस्य अमूल्यग्रन्थः अस्ति। कुरुक्षेत्रे युद्धभूमौ भगवान् श्रीकृष्णः अर्जुनाय यत् दिव्यज्ञानम् उपदिष्टवान्, तदेव गीताशास्त्रम्। कर्मयोगः, भक्तियोगः, ज्ञानयोगः च अत्र विस्तरेण प्रतिपादिताः सन्ति। (The timeless 700-verse philosophical dialogue on duty, righteousness, and spiritual wisdom).",
    chapters: [
      {
        title: "अथ प्रथमोऽध्यायः - अर्जुनविषादयोगः",
        content: `<h1>अथ प्रथमोऽध्यायः - अर्जुनविषादयोगः</h1>
<p style="font-size:1.15em; line-height:2.0; font-family:'Noto Serif Devanagari', 'Nirmala UI', serif;">
<strong>धृतराष्ट्र उवाच —</strong><br>
धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।<br>
मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥ १.१ ॥<br><br>
<strong>सञ्जय उवाच —</strong><br>
दृष्ट्वा तु पाण्डवानीकं व्यूढं दुर्योधनस्तदा ।<br>
आचार्यमुपसङ्गम्य राजा वचनमब्रवीत् ॥ १.२ ॥<br><br>
पश्यैतां पाण्डुपुत्राणामाचार्य महतीं चमूम् ।<br>
व्यूढां द्रुपदपुत्रेण तव शिष्येण धीमता ॥ १.३ ॥
</p>
<hr style="margin:20px 0; border:0; border-top:1px solid rgba(255,255,255,0.1);">
<p><em>English Commentary:</em></p>
<p><strong>Dhritarashtra said:</strong> O Sanjaya, assembled on the sacred field of Kurukshetra, eager for battle, what did my sons and the sons of Pandu do?</p>
<p><strong>Sanjaya said:</strong> Seeing the army of the Pandavas arranged in military formation, King Duryodhana approached his teacher Drona and spoke with urgency.</p>`
      },
      {
        title: "अथ द्वितीयोऽध्यायः - साङ्ख्ययोगः",
        content: `<h1>अथ द्वितीयोऽध्यायः - साङ्ख्ययोगः</h1>
<p style="font-size:1.15em; line-height:2.0; font-family:'Noto Serif Devanagari', 'Nirmala UI', serif;">
<strong>श्रीभगवानुवाच —</strong><br>
कुतस्त्वा कश्मलमिदं विषमे समुपस्थितम् ।<br>
अनार्यजुष्टमस्वर्ग्यमकीर्तिकरमर्जुन ॥ २.२ ॥<br><br>
क्लैब्यं मा स्म गमः पार्थ नैतत्त्वय्युपपद्यते ।<br>
क्षुद्रं हृदयदौर्बल्यं त्यक्त्वोत्तिष्ठ परन्तप ॥ २.३ ॥<br><br>
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।<br>
मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥ २.४७ ॥
</p>
<hr style="margin:20px 0; border:0; border-top:1px solid rgba(255,255,255,0.1);">
<p><em>English Commentary:</em></p>
<p><strong>The Supreme Lord said:</strong> You have a right to your duty, but not to the fruits thereof. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty. Cast off this faint-heartedness and arise, O conqueror of foes!</p>`
      }
    ]
  },
  {
    id: "chha_mana_atha_guntha",
    title: "ଛମାଣ ଆଠଗୁଣ୍ଠ (Chha Mana Atha Guntha)",
    author: "ଫକୀର ମୋହନ ସେନାପତି (Fakir Mohan Senapati)",
    cover: "assets/covers/river_of_broken_glass.png",
    rating: 5,
    reviewsCount: 3120,
    genre: "Odia Literature",
    subGenres: ["Odia", "Social Realism", "Classic Novel"],
    pages: 280,
    format: "DOCX",
    language: "Odia",
    published: "1897",
    readingTime: "6h 30m",
    shelf: "recommended",
    progress: 0,
    currentPage: 1,
    isFavorite: false,
    synopsis: "ଛମାଣ ଆଠଗୁଣ୍ଠ ଓଡ଼ିଆ ସାହିତ୍ୟର ପ୍ରଥମ ପୂର୍ଣ୍ଣାଙ୍ଗ ସାମାଜିକ ଉପନ୍ୟାସ। ବ୍ୟାସକବି ଫକୀର ମୋହନ ସେନାପତିଙ୍କ କାଳଜୟୀ କୃତିରେ ଜମିଦାର ରାମଚନ୍ଦ୍ର ମଙ୍ଗରାଜଙ୍କ ଅତ୍ୟାଚାର, ସରଳ ଚାଷୀ ଭଗିଆ ଓ ସାରିଆଙ୍କ କରୁଣ କାହାଣୀ ଏବଂ ସମାଜର ବାସ୍ତବ ଚିତ୍ର ଅତ୍ୟନ୍ତ ନିଖୁଣ ଭାବେ ରୂପାୟିତ ହୋଇଛି। (The foundational masterpiece of modern Odia realism and rural society).",
    chapters: [
      {
        title: "ପ୍ରଥମ ପରିଚ୍ଛେଦ: ରାମଚନ୍ଦ୍ର ମଙ୍ଗରାଜ",
        content: `<h1>ପ୍ରଥମ ପରିଚ୍ଛେଦ: ରାମଚନ୍ଦ୍ର ମଙ୍ଗରାଜ</h1>
<p style="font-size:1.15em; line-height:2.2; font-family:'Noto Serif Oriya', 'Nirmala UI', serif;">
ଶେଖ ଦିଲଦାର ମିଆଁଙ୍କ ଫତେପୁର ସାହାପୁର ଜମିଦାରୀର ମୁଖ୍ୟ ପରିଚାଳକ ହେଉଛନ୍ତି ଆମର ଶ୍ରୀଯୁକ୍ତ ରାମଚନ୍ଦ୍ର ମଙ୍ଗରାଜ ମହାଶୟ। ମଙ୍ଗରାଜେ ଜଣେ ଧାର୍ମିକ ଓ ନିଷ୍ଠାପର ଲୋକ ବୋଲି ଚାରିଆଡ଼େ ପ୍ରସିଦ୍ଧି। ପ୍ରତି ଏକାଦଶୀ ଦିନ ସେ ନିର୍ଜଳା ଉପବାସ ପାଳନ କରନ୍ତି, ମୁହଁରେ ସଦାସର୍ବଦା ହରିନାମ। କିନ୍ତୁ ଗାଁର ଗରିବ ଲୋକଙ୍କ ଜମିବାଡ଼ି କିପରି ତାଙ୍କ ହାତକୁ ଚାଲିଆସେ, ତାହା କେହି ବୁଝିପାରନ୍ତି ନାହିଁ।
</p>
<p style="font-size:1.15em; line-height:2.2; font-family:'Noto Serif Oriya', 'Nirmala UI', serif;">
ସେହି ଗ୍ରାମରେ ବସବାସ କରୁଥିବା ନିରୀହ ତନ୍ତୀ ଭଗିଆ ଓ ତା' ସ୍ତ୍ରୀ ସାରିଆଙ୍କ ପାଖରେ ଥିଲା ମାତ୍ର 'ଛଅ ମାଣ ଆଠ ଗୁଣ୍ଠ' ଉର୍ବର ଜମି ଓ ଗୋଟିଏ ସୁନ୍ଦର କପିଳା ଗାଈ। ସେହି ଜମି ଉପରେ ମଙ୍ଗରାଜଙ୍କ କୂଟନଜର ପଡ଼ିଲା।
</p>`
      },
      {
        title: "ଦ୍ୱିତୀୟ ପରିଚ୍ଛେଦ: ଭଗିଆ ଓ ସାରିଆ",
        content: `<h1>ଦ୍ୱିତୀୟ ପରିଚ୍ଛେଦ: ଭଗିଆ ଓ ସାରିଆ</h1>
<p style="font-size:1.15em; line-height:2.2; font-family:'Noto Serif Oriya', 'Nirmala UI', serif;">
ଭଗିଆ ଏବଂ ସାରିଆ ନିଃସନ୍ତାନ ଦମ୍ପତି। ତାଙ୍କ ପାଇଁ ସେହି ଛଅ ମାଣ ଆଠ ଗୁଣ୍ଠ ଜମି କେବଳ ଭୂମି ନଥିଲା, ତାହା ଥିଲା ସେମାନଙ୍କ ଜୀବନର ସର୍ବସ୍ୱ। ପ୍ରତିଦିନ ସକାଳୁ ଭଗିଆ ହଳ ଲଙ୍ଗଳ ଧରି କ୍ଷେତକୁ ଯାଏ, ସାରିଆ ତାହା ପାଇଁ ପଖାଳ କଂସା ନେଇ ପହଞ୍ଚେ। ସେମାନଙ୍କ ଶାନ୍ତିପୂର୍ଣ୍ଣ ଜୀବନରେ କଳା ବାଦଲ ଘୋଟି ଆସିଲା ଯେତେବେଳେ ମଙ୍ଗରାଜଙ୍କ ଷଡ଼ଯନ୍ତ୍ର ଆରମ୍ଭ ହେଲା।
</p>`
      }
    ]
  },
  {
    id: "godan",
    title: "गोदान (Godan)",
    author: "मुंशी प्रेमचंद (Munshi Premchand)",
    cover: "assets/covers/ill_be_your_blue_sky.png",
    rating: 5,
    reviewsCount: 3890,
    genre: "Hindi Literature",
    subGenres: ["Hindi", "Classic Fiction", "Social Realism"],
    pages: 340,
    format: "TXT",
    language: "Hindi",
    published: "1936",
    readingTime: "7h 45m",
    shelf: "recommended",
    progress: 0,
    currentPage: 1,
    isFavorite: true,
    synopsis: "गोदान हिन्दी साहित्य का महानतम उपन्यास है। कथाकार मुंशी प्रेमचंद ने भारतीय कृषक जीवन के संघर्ष, आकांक्षाओं, धर्मान्धता और महाजनी शोषण का ऐसा मर्मस्पर्शी चित्रण किया है जो आज भी प्रासंगिक है। किसान होरी और उसकी पत्नी धनिया का जीवन एक गाय पालने की सात्विक इच्छा के इर्द-गिर्द घूमता है। (The epic chronicle of Indian peasant resilience).",
    chapters: [
      {
        title: "पहला अध्याय: होरी और धनिया",
        content: `<h1>पहला अध्याय: होरी और धनिया</h1>
<p style="font-size:1.15em; line-height:2.0; font-family:'Noto Serif Devanagari', 'Nirmala UI', serif;">
होरी महतो ने दोनों बैलों को सानी-पानी देकर अपनी पत्नी धनिया से कहा— "अब मैं ज़रा रायसाहब के दरबार में हो आऊं, देर हो जाएगी।"<br><br>
धनिया ने अपने पुराने पल्लू से माथे का पसीना पोंछते हुए कहा— "जाते हो तो सीधे चले आना, वहां किसी बखेड़े में मत पड़ना। घर में दो जून की रोटी का ठिकाना नहीं है और तुम्हें दरबार की सूझती है।"<br><br>
होरी के मन में वर्षों से एक लालसा दबी पड़ी थी— एक सुंदर, दुधारू पछाहीं गाय उसके द्वार पर बंधी हो। गाय का द्वार पर होना किसान के लिए मर्यादा और लक्ष्मी का साक्षात स्वरूप था।
</p>
<p style="font-size:1.15em; line-height:2.0; font-family:'Noto Serif Devanagari', 'Nirmala UI', serif;">
होरी पगिया संभालते हुए पगडंडी पर चल पड़ा। खेतों में गेहूं की बालियां सुनहरी धूप में झूम रही थीं, पर इस सुनहरी छटा के पीछे कर्ज के जाल में उलझे हजारों किसानों के आंसू छिपे थे।
</p>`
      },
      {
        title: "दूसरा अध्याय: भोला की गाय",
        content: `<h1>दूसरा अध्याय: भोला की गाय</h1>
<p style="font-size:1.15em; line-height:2.0; font-family:'Noto Serif Devanagari', 'Nirmala UI', serif;">
रास्ते में भोला ग्वाला अपनी गायों को चराकर लौट रहा था। होरी ने उसे देखकर राम-राम किया। भोला के पास एक चितकबरी गाय थी, जिसे देखकर होरी की आंखें तृप्त हो गईं।<br><br>
"भोला दादा, इस गाय की क्या कीमत लोगे?" होरी ने झिझकते हुए पूछा। भोला ने हंसकर कहा— "होरी भाई, तुम्हारे लिए क्या दाम और क्या मोल? पसंद है तो अपने खूंटे से बांध लो।"
</p>`
      }
    ]
  }
];

// Writers list matching Dribbble UI
const POPULAR_WRITERS = [
  {
    id: "writer_amelia",
    name: "Amelia Atwater",
    avatar: "assets/avatars/author_amelia.png",
    booksCount: 7,
    bio: "Bestselling historical and literary fiction novelist celebrated for atmospheric world-building."
  },
  {
    id: "writer_christopher",
    name: "Christopher Paolini",
    avatar: "assets/avatars/author_christopher.png",
    booksCount: 12,
    bio: "Renowned fantasy and epic adventure author of the Inheritance Cycle and space sagas."
  },
  {
    id: "writer_jonathan",
    name: "Jonathan Franzen",
    avatar: "assets/avatars/author_jonathan.png",
    booksCount: 9,
    bio: "Acclaimed American novelist and essayist, Pulitzer Prize finalist and National Book Award winner."
  }
];

// Genres list matching Dribbble sidebar
const GENRES = [
  "Fiction",
  "Novel",
  "Science Fiction",
  "Fantasy",
  "Non-fiction",
  "Genre Fiction",
  "Mystery",
  "Thriller",
  "Young Adult Fiction",
  "Romance Novel",
  "Horror Fiction",
  "Sanskrit & Classics",
  "Odia Literature",
  "Hindi Literature"
];
