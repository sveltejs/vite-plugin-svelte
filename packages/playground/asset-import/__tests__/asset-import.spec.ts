import { getEl } from '../../testUtils';

test('should render svg', async () => {
	expect(await getEl('svg')).toBeTruthy();
});
