import { getEl } from '../../testUtils';

test('should render svg', async () => {
	expect(await getEl('svg')).toBeTruthy();
});

test('should render html', async () => {
	expect(await getEl('#logotext')).toBeTruthy();
	expect(await getEl('img')).toBeTruthy();
});
