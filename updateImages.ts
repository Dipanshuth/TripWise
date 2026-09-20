import fs from 'fs';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWikiImage(query: string) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'TripWiseMockDataGenerator/1.0 (tripwise@example.com)'
        }
    });
    if (!res.ok) {
        console.error("HTTP Error", res.status, await res.text());
        return null;
    }
    const text = await res.text();
    try {
        const data = JSON.parse(text);
        const pages = data.query?.pages;
        if (!pages) return null;
        const pageId = Object.keys(pages)[0];
        if (pageId !== "-1" && pages[pageId].original) {
          return pages[pageId].original.source;
        }
    } catch (e) {
        console.error("Failed to parse JSON for", query, text);
    }
  } catch (e) {
    console.error("Failed to fetch image for", query, e);
  }
  return null;
}

const getWikiQuery = (name: string) => {
    const mappings: Record<string, string> = {
        'Kullu': 'Kullu',
        'Manali': 'Manali, Himachal Pradesh',
        'Goa': 'Goa',
        'Jaipur': 'Jaipur',
        'Agra': 'Agra',
        'Varanasi': 'Varanasi',
        'Munnar': 'Munnar',
        'Udaipur': 'Udaipur',
        'Rishikesh': 'Rishikesh',
        'Darjeeling': 'Darjeeling',
        'Hampi': 'Hampi',
        'Andaman Islands': 'Andaman and Nicobar Islands',
        'Raghunath Temple': 'Raghunath Temple, Kullu',
        'Great Himalayan National Park': 'Great Himalayan National Park',
        'Kasol': 'Kasol',
        'Manikaran': 'Manikaran',
        'Solang Valley': 'Solang Valley',
        'Rohtang Pass': 'Rohtang Pass',
        'Hadimba Temple': 'Hidimba Devi Temple',
        'Baga Beach': 'Baga Beach',
        'Fort Aguada': 'Fort Aguada',
        'Dudhsagar Falls': 'Dudhsagar Falls',
        'Amber Palace': 'Amer Fort',
        'Hawa Mahal': 'Hawa Mahal',
        'City Palace': 'City Palace, Jaipur',
        'Taj Mahal': 'Taj Mahal',
        'Agra Fort': 'Agra Fort',
        'Fatehpur Sikri': 'Fatehpur Sikri',
        'Dashashwamedh Ghat': 'Dashashwamedh Ghat',
        'Kashi Vishwanath Temple': 'Kashi Vishwanath Temple',
        'Sarnath': 'Sarnath',
        'Tea Gardens': 'Tea garden',
        'Mattupetty Dam': 'Mattupetty Dam',
        'Eravikulam National Park': 'Eravikulam National Park',
        'City Palace, Udaipur': 'City Palace, Udaipur',
        'Lake Pichola': 'Lake Pichola',
        'Jag Mandir': 'Jag Mandir',
        'Lakshman Jhula': 'Lakshman Jhula',
        'Triveni Ghat': 'Triveni Ghat',
        'Beatles Ashram': 'Beatles Ashram',
        'Tiger Hill': 'Tiger Hill, Darjeeling',
        'Batasia Loop': 'Batasia Loop',
        'Padmaja Naidu Himalayan Zoological Park': 'Padmaja Naidu Himalayan Zoological Park',
        'Virupaksha Temple': 'Virupaksha Temple, Hampi',
        'Vijaya Vittala Temple': 'Vitthala Temple, Hampi',
        'Matanga Hill': 'Matanga Hill',
        'Radhanagar Beach': 'Radhanagar Beach',
        'Cellular Jail': 'Cellular Jail',
        'Ross Island': 'Netaji Subhash Chandra Bose Island'
    };
    return mappings[name] || name;
}

async function processFileSafe(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const blocks = content.split('  },');
  
  for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];
      const nameMatch = block.match(/name:\s*'([^']+)'/);
      const imageMatch = block.match(/image:\s*'([^']+)'/);
      
      if (nameMatch && imageMatch) {
          const name = nameMatch[1];
          const query = getWikiQuery(name);
          
          await delay(200); // polite delay
          let newImageUrl = await fetchWikiImage(query);
          
          if (!newImageUrl) {
              console.log('No image found for', name, '- using fallback');
              newImageUrl = `https://placehold.co/800x600/e2e8f0/1e293b?text=${encodeURIComponent(name)}`;
          }
          
          block = block.replace(imageMatch[0], `image: '${newImageUrl}'`);
          blocks[i] = block;
          console.log(`Replaced image for ${name}`);
      }
  }
  
  fs.writeFileSync(filePath, blocks.join('  },'));
  console.log(`Updated ${filePath}`);
}

async function main() {
  await processFileSafe('src/data/destinations.ts');
  await processFileSafe('src/data/places.ts');
}

main();
