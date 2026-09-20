const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// 1. Update Hero section
content = content.replace('<div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-[-100px]">',
'<Reveal><div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-[-100px]">');
content = content.replace('          </div>\r\n        </div>\r\n      </section>',
'          </div>\r\n        </div></Reveal>\r\n      </section>');
content = content.replace('          </div>\n        </div>\n      </section>',
'          </div>\n        </div></Reveal>\n      </section>');

// 2. Update Floating Planner Card
content = content.replace('<Card className="p-2 sm:p-4">', '<Reveal delay={0.2}><Card className="p-2 sm:p-4">');
content = content.replace('</Card>\r\n      </section>', '</Card></Reveal>\r\n      </section>');
content = content.replace('</Card>\n      </section>', '</Card></Reveal>\n      </section>');

// 3. Update Popular Destinations
content = content.replace('<div className="flex justify-between items-end mb-10">',
'<Reveal><div className="flex justify-between items-end mb-10">');
content = content.replace('        </div>\r\n\r\n        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">',
'        </div></Reveal>\r\n\r\n        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">');
content = content.replace('        </div>\n\n        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">',
'        </div></Reveal>\n\n        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">');

content = content.replace('{mockDestinations.map(dest => (', '{mockDestinations.map((dest, index) => (');
content = content.replace('<div \r\n              key={dest.id}', '<Reveal key={dest.id} delay={index * 0.1}>\r\n<div ');
content = content.replace('<div \n              key={dest.id}', '<Reveal key={dest.id} delay={index * 0.1}>\n<div ');
content = content.replace('</Button>\r\n              </div>\r\n            </div>\r\n          ))}',
'</Button>\r\n              </div>\r\n            </div>\r\n            </Reveal>\r\n          ))}');
content = content.replace('</Button>\n              </div>\n            </div>\n          ))}',
'</Button>\n              </div>\n            </div>\n            </Reveal>\n          ))}');

fs.writeFileSync('src/pages/Home.tsx', content);
