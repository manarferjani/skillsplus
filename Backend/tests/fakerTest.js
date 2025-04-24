const { faker } = require('@faker-js/faker');


for (let i = 0; i < 100; i++) {
    console.log(faker.number.int({ min: 1, max: 3 }));
}

