import {
  ComponentType,
  InteractionResponseType,
  TextInputStyle,
} from "npm:discord-api-types/v10";
import { InternalHandler } from "../types.ts";

export const handleAlert: InternalHandler = () => ({
  type: InteractionResponseType.Modal,
  data: {
    custom_id: "alert",
    title: "Alert settings",
    components: [{
      type: ComponentType.ActionRow,
      components: [{
        type: ComponentType.TextInput,
        custom_id: "message",
        label: "Message",
        placeholder: "@lobby",
        style: TextInputStyle.Paragraph,
        required: false,
      }],
    }, {
      type: ComponentType.ActionRow,
      components: [{
        type: ComponentType.TextInput,
        custom_id: "map",
        label: "File name",
        placeholder: "/tree.*tag/i",
        style: TextInputStyle.Short,
        required: false,
      }],
    }, {
      type: ComponentType.ActionRow,
      components: [{
        type: ComponentType.TextInput,
        custom_id: "host",
        label: "Host",
        placeholder: "verit",
        style: TextInputStyle.Short,
        required: false,
      }],
    }, {
      type: ComponentType.ActionRow,
      components: [{
        type: ComponentType.TextInput,
        custom_id: "name",
        label: "Lobby name",
        placeholder: "-aram",
        style: TextInputStyle.Short,
        required: false,
      }],
    }, {
      type: ComponentType.ActionRow,
      components: [{
        type: ComponentType.TextInput,
        custom_id: "server",
        label: "Realm",
        placeholder: "us, eu, or kr",
        style: TextInputStyle.Short,
        required: false,
      }],
    }],
  },
});
