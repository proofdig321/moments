// Add test moments for public display
async function addTestMoments() {
  const testMoments = [
    {
      title: "Community Garden Project Launch",
      content: "New community garden opens in Soweto this Saturday. Free seedlings and training provided. Join us at 9 AM for the opening ceremony.",
      region: "GP",
      category: "Opportunity",
      status: "broadcasted",
      broadcasted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Digital Skills Workshop",
      content: "Free computer literacy classes starting next week in Durban. Learn basic computer skills, internet safety, and online job applications.",
      region: "KZN", 
      category: "Education",
      status: "broadcasted",
      broadcasted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Health Screening Drive",
      content: "Free health screenings available at Cape Town Community Center. Blood pressure, diabetes, and vision tests. No appointment needed.",
      region: "WC",
      category: "Health", 
      status: "broadcasted",
      broadcasted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Youth Soccer Tournament",
      content: "Annual youth soccer tournament registration now open. Ages 12-18 welcome. Prizes for winning teams. Register at local community center.",
      region: "EC",
      category: "Events",
      status: "broadcasted", 
      broadcasted_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Small Business Support Program", 
      content: "Government-backed small business loans and mentorship program. Applications open until month end. Free business plan assistance available.",
      region: "FS",
      category: "Opportunity",
      status: "broadcasted",
      broadcasted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const moment of testMoments) {
    try {
      const response = await fetch('/admin/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin.auth.token')}`
        },
        body: JSON.stringify(moment)
      });
      
      if (response.ok) {
        console.log(`Added: ${moment.title}`);
      }
    } catch (error) {
      console.error(`Failed to add: ${moment.title}`);
    }
  }
}

// Run this in browser console when logged into admin
// addTestMoments();