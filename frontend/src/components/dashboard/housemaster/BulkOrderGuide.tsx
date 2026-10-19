export function BulkOrderGuide() {
  return (
    <>
      <p>
        Bulk orders let you place tuck shop orders for many students at once, without anyone needing a PIN or a
        device. You are the authorized person confirming the order.
      </p>
      <ol>
        <li>
          <strong>Start a batch.</strong> Click <strong>New batch</strong> and give it an optional name, like
          &quot;Friday tuck shop, JSS block&quot;.
        </li>
        <li>
          <strong>Find students.</strong> Search by name or admission number, or filter by class or house, then tick
          the students you want.
        </li>
        <li>
          <strong>Add them, or apply a product.</strong> Add the ticked students to the batch, or choose a product and
          quantity and click <strong>Apply</strong> to give every ticked student the same item (for example, 1 bottled
          water for 60 students at once).
        </li>
        <li>
          <strong>Fine-tune individuals.</strong> Click <strong>Edit</strong> on any student to add several products
          or change quantities. Totals are calculated automatically from the Seller&apos;s price list, so you never
          type or calculate amounts yourself.
        </li>
        <li>
          <strong>Check the status column.</strong> <em>Ready</em> means the student can afford the order,{" "}
          <em>Insufficient</em> shows exactly how much they&apos;re short, and <em>No items</em> means nothing has been
          added yet. Fix or remove problem students before confirming if you can.
        </li>
        <li>
          <strong>Review and confirm.</strong> Every student with enough balance is charged from their own wallet and
          the Seller is credited. Students who can&apos;t afford their order are skipped, with no partial deductions,
          and flagged on the results page. Each student gets their own separate transaction.
        </li>
        <li>
          <strong>Reuse it.</strong> From the batch list or results page, use <strong>Duplicate</strong> to start a
          new batch with the same students and items, then edit what changed.
        </li>
      </ol>
      <p>
        <strong>Custom amounts</strong> are for rare special cases only. They require a written reason and are saved
        with the order for auditing.
      </p>
    </>
  );
}
