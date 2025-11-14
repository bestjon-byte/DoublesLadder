// Test file to debug the Marc Hodge name issue

// Copy of createShortNames function from WhatsAppPostGenerator.js
const createShortNames = (allPlayerNames) => {
  const nameMap = {};

  // Remove duplicates from input
  const uniqueNames = [...new Set(allPlayerNames.filter(name => name))];

  // Create map of first names to full names
  const firstNameGroups = {};
  uniqueNames.forEach(fullName => {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

    if (!firstNameGroups[firstName]) {
      firstNameGroups[firstName] = [];
    }
    firstNameGroups[firstName].push({ fullName, firstName, lastName });
  });

  // Create short names
  Object.values(firstNameGroups).forEach(group => {
    if (group.length === 1) {
      // Only one person with this first name - use first name only
      nameMap[group[0].fullName] = group[0].firstName;
    } else {
      // Multiple people with same first name - add minimal last name chars
      group.forEach(person => {
        if (person.lastName) {
          // Find minimum characters needed to make unique
          let shortName = person.firstName;
          let suffixLength = 1;
          let isUnique = false;

          while (!isUnique && suffixLength <= person.lastName.length) {
            const testName = `${person.firstName} ${person.lastName.substring(0, suffixLength)}`;

            // Check if this combination is unique among the group
            const conflicts = group.filter(other =>
              other !== person &&
              other.lastName &&
              other.lastName.substring(0, suffixLength) === person.lastName.substring(0, suffixLength)
            );

            if (conflicts.length === 0) {
              shortName = testName;
              isUnique = true;
            } else {
              suffixLength++;
            }
          }

          // If still not unique, use full last name
          if (!isUnique) {
            shortName = `${person.firstName} ${person.lastName}`;
          }

          nameMap[person.fullName] = shortName;
        } else {
          // No last name available, just use first name
          nameMap[person.fullName] = person.firstName;
        }
      });
    }
  });

  return nameMap;
};

// Test cases
console.log('\n=== Test 1: Marc Hodge alone ===');
const test1 = createShortNames(['Marc Hodge']);
console.log(test1);

console.log('\n=== Test 2: marc hodge (lowercase) ===');
const test2 = createShortNames(['marc hodge']);
console.log(test2);

console.log('\n=== Test 3: Marc Hodge with Mark Someone ===');
const test3 = createShortNames(['Marc Hodge', 'Mark Amy']);
console.log(test3);

console.log('\n=== Test 4: marc hodge with Mark Amy (mixed case) ===');
const test4 = createShortNames(['marc hodge', 'Mark Amy']);
console.log(test4);

console.log('\n=== Test 5: Multiple players including Marc ===');
const test5 = createShortNames(['Jon Best', 'marc hodge', 'Mark Amy', 'Charlie Watson']);
console.log(test5);
