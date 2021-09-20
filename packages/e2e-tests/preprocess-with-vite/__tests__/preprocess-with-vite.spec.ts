import { getColor, getText } from 'testUtils';

test('should render App', async () => {
	expect(await getText('h1.foo')).toBe(`Hello world`);
	expect(await getColor('#app-scss')).toBe('#000099'); // darken($blue, 20)
	expect(await getText('#foo-title')).toBe(`Styles with stylus blub`);
	expect(await getColor('#foo-title')).toBe('magenta');
	expect(await getColor('p.note')).toBe(`#ff3e00`);
});
