"use client";

import { useSiteSettings } from "@/lib/site-settings-context";

export default function PrivacyPage() {
  const { settings } = useSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-medium uppercase tracking-wide text-accent-600">Документ</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-brand-900">
        Политика обработки персональных данных
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Действует с 23.07.2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-600">
        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">1. Общие положения</h2>
          <p className="mt-3">
            Настоящая Политика обработки персональных данных (далее — «Политика») действует в
            отношении всех персональных данных, которые сайт {settings.name} (далее — «Оператор»)
            может получить от пользователя во время использования сайта, в том числе при
            оформлении заказа.
          </p>
          <p className="mt-3">
            Политика составлена в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О
            персональных данных».
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">2. Оператор персональных данных</h2>
          <p className="mt-3">
            Оператором является {settings.name}. Реквизиты индивидуального предпринимателя/
            организации (наименование, ИНН, ОГРНИП) будут указаны здесь после государственной
            регистрации.
          </p>
          <p className="mt-3">
            Контакты для связи по вопросам обработки персональных данных: телефон {settings.phone}
            {settings.email ? `, email ${settings.email}` : ""}.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">
            3. Какие данные обрабатываются
          </h2>
          <p className="mt-3">При оформлении заказа на сайте Оператор собирает:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>имя;</li>
            <li>номер телефона;</li>
            <li>способ получения заказа и комментарий к заказу (если указан);</li>
            <li>состав и сумму заказа.</li>
          </ul>
          <p className="mt-3">
            Сайт не запрашивает и не обрабатывает специальные категории персональных данных
            (о здоровье, религиозных убеждениях и т.п.).
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">4. Цели обработки</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>оформление и выполнение заказа, связь с покупателем по заказу;</li>
            <li>информирование о статусе заказа и условиях получения;</li>
            <li>ответы на обращения, отправленные через сайт или мессенджеры.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">5. Правовые основания</h2>
          <p className="mt-3">
            Обработка персональных данных осуществляется на основании согласия субъекта
            персональных данных, полученного при оформлении заказа на сайте (ст. 6 152-ФЗ), а
            также в целях исполнения договора купли-продажи, стороной которого является субъект
            персональных данных.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">
            6. Хранение и передача данных
          </h2>
          <p className="mt-3">
            Персональные данные хранятся в электронной базе данных сайта. Доступ к данным имеют
            только лица, которым это необходимо для обработки заказов. Данные не передаются
            третьим лицам, за исключением случаев, необходимых для выполнения заказа (например,
            служба доставки), и случаев, предусмотренных законодательством РФ.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">7. Срок хранения</h2>
          <p className="mt-3">
            Персональные данные обрабатываются и хранятся до достижения цели их обработки либо до
            отзыва согласия субъектом персональных данных, если иное не предусмотрено
            законодательством РФ.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">
            8. Права субъекта персональных данных
          </h2>
          <p className="mt-3">Пользователь вправе:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>получить информацию, касающуюся обработки его персональных данных;</li>
            <li>требовать уточнения, блокирования или уничтожения своих персональных данных;</li>
            <li>в любой момент отозвать согласие на обработку персональных данных.</li>
          </ul>
          <p className="mt-3">
            Для реализации этих прав достаточно обратиться по контактам, указанным в разделе 2.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">
            9. Меры защиты персональных данных
          </h2>
          <p className="mt-3">
            Оператор принимает необходимые организационные и технические меры для защиты
            персональных данных от неправомерного или случайного доступа, уничтожения,
            изменения, блокирования, копирования, распространения, а также от иных
            неправомерных действий третьих лиц.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-brand-900">
            10. Изменение политики
          </h2>
          <p className="mt-3">
            Оператор вправе вносить изменения в настоящую Политику. Новая редакция вступает в
            силу с момента её размещения на сайте.
          </p>
        </section>
      </div>
    </div>
  );
}
