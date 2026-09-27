import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | NIQUE SPORTS",
  description: "How Apanique collects, uses, stores, and shares personal information.",
};

const sections = [
  {
    title: "1. Who We Are",
    content: (
      <>
        <p>
          This Privacy Policy applies to the NIQUE SPORTS website and related
          shopping and customer-support services operated by Apanique in
          Bangladesh ("Apanique," "NIQUE SPORTS," "we," "us," or "our").
        </p>
        <p>
          For privacy questions or requests, contact us at{" "}
          <a className="font-semibold text-primary underline underline-offset-4" href="mailto:niquesports2@gmail.com">
            niquesports2@gmail.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "2. Information We Collect",
    content: (
      <>
        <p>Depending on how you use the website, we may collect:</p>
        <ul>
          <li>
            <strong>Account information:</strong> your name, email address,
            password credential, and any phone number, shipping address, or
            profile photo you choose to provide. Phone number and address are
            optional in the registration form, but may be needed to fulfill an
            order.
          </li>
          <li>
            <strong>Order and customization information:</strong> products,
            sizes, quantities, selected font or patch options, custom name or
            number, order status, delivery details, and communications about an
            order.
          </li>
          <li>
            <strong>Payment reference information:</strong> for bKash payments,
            the transaction ID, phone number, and amount needed to verify the
            payment. Payment processing is also subject to bKash's own terms
            and privacy practices.
          </li>
          <li>
            <strong>Support and social messages:</strong> information you send
            to us, including chat or inquiry history on Facebook, Instagram,
            TikTok, email, or other channels you use to contact us.
          </li>
          <li>
            <strong>Technical information:</strong> information that may appear
            in hosting and security logs, such as IP address, browser or device
            details, request time, and pages requested.
          </li>
          <li>
            <strong>Browser storage:</strong> authentication session cookies
            needed to sign in and keep the service working. The shopping cart
            is stored in your browser's local storage so it remains available
            between visits on that browser.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "3. How We Use Information",
    content: (
      <>
        <p>We use information to:</p>
        <ul>
          <li>create and secure accounts and authenticate sign-ins;</li>
          <li>take, manage, verify, and fulfill orders and deliveries;</li>
          <li>respond to questions, provide support, and resolve disputes;</li>
          <li>remember cart contents and product customization choices;</li>
          <li>operate, troubleshoot, maintain, and protect the website;</li>
          <li>send service messages about accounts or orders; and</li>
          <li>
            send promotional updates using contact details where permitted.
            You can ask us to stop promotional messages by emailing us.
          </li>
        </ul>
        <p>
          We do not sell personal information. We use it for the purposes
          described here and may share limited information with service
          providers that help us operate the business.
        </p>
      </>
    ),
  },
  {
    title: "4. When We Share Information",
    content: (
      <>
        <p>
          We share only information reasonably needed for the relevant purpose,
          including with:
        </p>
        <ul>
          <li>
            <strong>Website and infrastructure providers:</strong> Vercel
            provides website hosting and may process technical request logs.
            Account authentication is provided by Better Auth, with account
            data stored in a MongoDB database. The specific database hosting
            region and provider are not identified in the website configuration.
          </li>
          <li>
            <strong>Image-hosting providers:</strong> profile photos submitted
            during registration are uploaded to ImgBB. Product and other
            administrative images are uploaded to Cloudinary.
          </li>
          <li>
            <strong>Payment providers:</strong> bKash may process a payment;
            Apanique uses the payment reference details described above to
            verify it.
          </li>
          <li>
            <strong>Delivery providers:</strong> when an order is shipped, the
            selected courier, which may include Steadfast, Pathao, or RedX,
            receives the customer's name, phone number, and delivery address
            needed to deliver it.
          </li>
          <li>
            <strong>Social platforms:</strong> Facebook, Instagram, and TikTok
            process information when you contact or interact with us on those
            services. Their own privacy policies govern their handling of that
            information.
          </li>
          <li>
            <strong>Authorities or successors:</strong> where required by law,
            to protect rights and safety, or as part of a business transfer,
            restructuring, or sale.
          </li>
        </ul>
        <p>
          These providers may process information under their own terms and may
          store or access it outside Bangladesh. We do not control their
          independent privacy practices.
        </p>
      </>
    ),
  },
  {
    title: "5. Retention",
    content: (
      <p>
        We currently retain customer order history, contact details, and
        shipping addresses indefinitely unless you request deletion. We use
        these records to process orders, provide support, and send promotional
        updates. You may request deletion by emailing niquesports2@gmail.com.
        We may keep information that is necessary to complete an open order,
        resolve a dispute, protect the service, or meet a legal obligation; if
        so, we will limit its use to that purpose where practicable. We do not
        currently publish a fixed deletion schedule.
      </p>
    ),
  },
  {
    title: "6. Your Choices and Requests",
    content: (
      <>
        <p>
          You can update some account details through your account where those
          controls are available, clear your browser's local storage to remove
          its saved cart, and ask us to stop promotional messages. You may also
          email us to request access to, correction of, or deletion of personal
          information associated with you.
        </p>
        <p>
          We may ask for information reasonably needed to verify your identity
          before acting on a request. We will respond subject to applicable law
          and may retain limited records for the purposes described in the
          Retention section. A deletion request does not erase information
          already held independently by a payment provider, courier, or social
          platform; you may need to contact that provider directly.
        </p>
      </>
    ),
  },
  {
    title: "7. Security",
    content: (
      <p>
        We use service providers and operational safeguards intended to protect
        information. No website, transmission, or storage system can be
        guaranteed completely secure. Please use a unique password, keep your
        sign-in details private, and contact us promptly if you believe your
        account has been accessed without permission. Where applicable law
        requires notice of a security incident, we will follow those
        requirements.
      </p>
    ),
  },
  {
    title: "8. Children",
    content: (
      <p>
        The website is a general sportswear shopping service and is not
        designed to knowingly collect personal information from children
        without appropriate parent or guardian involvement. If you believe a
        child has provided personal information to us, contact us so we can
        review the request and take appropriate action.
      </p>
    ),
  },
  {
    title: "9. Third-Party Websites and Services",
    content: (
      <p>
        The website may link to third-party services or social platforms. A
        link or interaction with a provider does not make that provider's
        privacy practices ours. Review the provider's own notice before
        sharing information with it.
      </p>
    ),
  },
  {
    title: "10. Changes to This Policy",
    content: (
      <p>
        We may update this policy as our services or practices change. The
        effective date at the top of this page identifies the current version.
        If a change is significant, we will take reasonable steps to make the
        updated policy available before or when it takes effect. Continued use
        of the website does not remove any rights you have under applicable
        law.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="w-full">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          NIQUE SPORTS
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-bold text-text sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          Effective date: September 27, 2026
        </p>
        <p className="mt-6 max-w-3xl text-base leading-7 text-text-muted">
          This policy explains what personal information Apanique collects
          through NIQUE SPORTS, why we use it, which service providers may
          receive it, and how you can contact us about it.
        </p>

        <div className="mt-10 divide-y divide-border border-y border-border">
          {sections.map(({ title, content }) => (
            <section key={title} className="py-7">
              <h2 className="text-lg font-semibold text-text">{title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-text-muted [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
                {content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}