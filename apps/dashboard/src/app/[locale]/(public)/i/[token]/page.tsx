import CustomerHeader from "@/components/customer-heaader";
import InvoiceToolbar from "@/components/invoice-toolbar";
import { InvoiceCommentsSheet } from "@/components/sheets/invoice-comments";
import { HtmlTemplate } from "@midday/invoice/templates/html";
import { verify } from "@midday/invoice/token";
import { getInvoiceQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: { params: { token: string } }): Promise<Metadata> {
  const supabase = createClient({ admin: true });

  try {
    const { id } = await verify(params.token);
    const { data: invoice } = await getInvoiceQuery(supabase, id);

    if (!invoice) {
      return {
        title: "Invoice Not Found",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    return {
      title: `Invoice ${invoice.invoice_number} | ${invoice.team?.name}`,
      description: `Invoice for ${invoice.customer?.name || "Customer"}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch (error) {
    return {
      title: "Invalid Invoice",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

type Props = {
  params: { token: string };
};

export default async function Page({ params }: Props) {
  const supabase = createClient({ admin: true });

  try {
    const { id } = await verify(params.token);
    const { data: invoice } = await getInvoiceQuery(supabase, id);

    if (!invoice) {
      notFound();
    }

    const width = invoice.template.size === "letter" ? 816 : 595;
    const height = invoice.template.size === "letter" ? 1056 : 842;

    return (
      <div className="flex flex-col justify-center items-center min-h-screen dotted-bg p-4 sm:p-6 md:p-0">
        <div
          className="flex flex-col w-full max-w-full"
          style={{ maxWidth: width }}
        >
          <CustomerHeader
            name={invoice.customer_name || invoice.customer?.name}
            website={invoice.customer?.website}
            status={invoice.status}
          />
          <div className="pb-24 md:pb-0">
            <div className="shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]">
              <HtmlTemplate {...invoice} width={width} height={height} />
            </div>
          </div>
        </div>

        <InvoiceToolbar
          id={invoice.id}
          size={invoice.template.size}
          customer={invoice.customer}
        />

        <InvoiceCommentsSheet />

        <div className="fixed bottom-4 right-4 hidden md:block">
          <a
            href="https://midday.ai?utm_source=invoice"
            target="_blank"
            rel="noreferrer"
            className="text-[9px] text-[#878787]"
          >
            Powered by <span className="text-primary">midday</span>
          </a>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
