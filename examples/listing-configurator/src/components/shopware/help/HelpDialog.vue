<script setup lang="ts">
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";

const defaultValue = "item-1";

const accordionItems = [
  {
    value: "item-1",
    title: "What is the purpose of the listing configurator?",
    content:
      "This configurator is used to test the listing filters and options of the store API with various configurations/settings.",
  },
  {
    value: "item-2",
    title: "What kind of filter modes do we have?",
    content:
      "You can use shortcut filters (default), activate the plain filter or even use multi-filters. If you use multi-filters, you can also create multi-filter groups. To reduce the filter options (aggregations), you should use the plain filter or multi-filters and set the Reduce aggregation flag to true.",
  },
  {
    value: "item-3",
    title: "Can you explain shortcut filters in detail?",
    content: "",
  },
  {
    value: "item-4",
    title: "When should I use the plain filter?",
    content: "",
  },
  {
    value: "item-5",
    title: "When should I use multi-filters?",
    content: "",
  },
];
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline">
        Help and FAQ about this Configurator 🤔
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-7xl">
      <DialogHeader>
        <DialogTitle>Help and FAQ</DialogTitle>
        <DialogDescription> about the Listing Configurator </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <Accordion
          type="single"
          class="w-full"
          collapsible
          :default-value="defaultValue"
        >
          <AccordionItem
            v-for="item in accordionItems"
            :key="item.value"
            :value="item.value"
          >
            <AccordionTrigger>{{ item.title }}</AccordionTrigger>
            <AccordionContent>
              {{ item.content }}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary"> Close </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
