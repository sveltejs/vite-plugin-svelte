<script>
	import { Accordion, AccordionItem, Button, DatePickerInput } from 'carbon-components-svelte';
	import Link from 'carbon-components-svelte/src/Link/Link.svelte';
	import DatePicker from 'carbon-components-svelte/src/DatePicker/DatePicker.svelte';
	import { assign } from 'lodash-es';
	import toNumber from 'lodash-es/toNumber.js';
	import toPath from 'lodash-es/toPath.js';

	console.log(assign, toNumber, toPath);
</script>

<Button>Hello</Button>

<Link>A</Link>

<DatePicker datePickerType="single" flatpickrProps={{ static: true }}>
	<DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
</DatePicker>

<Accordion>
	<AccordionItem title="Section 1" open>Content 1</AccordionItem>
	<AccordionItem title="Section 2">Content 2</AccordionItem>
	<AccordionItem title="Section 3">Content 3</AccordionItem>
</Accordion>
