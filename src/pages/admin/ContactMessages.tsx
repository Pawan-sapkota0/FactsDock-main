import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, SUPABASE_AVAILABLE } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const fetchMessages = async () => {
  if (!SUPABASE_AVAILABLE) return [];
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id,name,email,message,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

const ContactMessages: React.FC = () => {
  const {
    data: messages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "contact_messages"],
    queryFn: fetchMessages,
  });

  const msgs = (messages as unknown as Record<string, unknown>[]) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Contact Messages</h1>
      {isLoading && <div>Loading messages...</div>}
      {error && <div className="text-red-600">Failed to load messages</div>}
      {!isLoading && msgs.length === 0 && (
        <div className="p-4 bg-muted rounded">No messages found.</div>
      )}

      {msgs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Message</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {msgs.map((m) => {
                const row = m as Record<string, unknown>;
                const id = String(row.id);
                const name = String(row.name || "");
                const email = String(row.email || "");
                const message = String(row.message || "");
                const created = String(row.created_at || "");
                return (
                  <tr key={id}>
                    <td className="px-4 py-2 align-top">{name}</td>
                    <td className="px-4 py-2 align-top">{email}</td>
                    <td className="px-4 py-2 align-top whitespace-pre-wrap max-w-xl">
                      {message}
                    </td>
                    <td className="px-4 py-2 align-top">
                      {new Date(created).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <a
                        href={`mailto:${email}?subject=Reply from World Facts`}
                        className="text-primary underline"
                      >
                        Reply
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
